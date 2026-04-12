import { ATELIERS, ATELIER_NAMES } from '../data/mockData';

const DEFAULT_CONFIG = {
  weeks: 4,
  atelierParams: {},
  maxWipPerStage: 4,
  maxConsecutiveSameProduct: 3,
  weights: {
    earliestStart: 1.0,
    progressBonus: 2.0,
    wipPenalty: 3.0,
    diversityPenalty: 1.5,
    urgencyBonus: 1.0,
    downstreamFit: 0.8,
  },
};

const DEFAULT_ATELIER_CFG = {
  daysPerWeek: 5,
  shiftsPerDay: 2,
  hoursPerShift: 8,
  efficiency: 100,
};

const WEEK_HOURS = 7 * 24;

export function schedule(products, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  cfg.weights = { ...DEFAULT_CONFIG.weights, ...config.weights };
  cfg.atelierParams = config.atelierParams || {};

  const calendars = {};
  for (const a of ATELIERS) {
    calendars[a] = createWorkCalendar({ ...DEFAULT_ATELIER_CFG, ...cfg.atelierParams[a] });
  }

  const jobs = expandJobs(products);
  const resources = initResources(calendars);
  const scheduled = [];
  const horizon = cfg.weeks * WEEK_HOURS;

  let safetyLimit = jobs.length * 20;

  while (hasPendingWork(jobs) && safetyLimit-- > 0) {
    const candidates = buildCandidates(jobs, resources, calendars, cfg, horizon);
    if (candidates.length === 0) {
      if (!advanceTime(jobs, resources)) break;
      continue;
    }

    scoreCandidates(candidates, jobs, resources, calendars, cfg, horizon);
    candidates.sort((a, b) => b.score - a.score);

    const best = candidates[0];
    const op = commitOperation(best, resources, calendars, cfg);
    scheduled.push(op);
  }

  return formatOutput(scheduled, products, calendars);
}

function createWorkCalendar(ac) {
  const workHoursPerDay = ac.shiftsPerDay * ac.hoursPerShift;
  const eff = Math.max(0.01, (ac.efficiency || 100) / 100);
  const dpw = Math.min(7, Math.max(1, ac.daysPerWeek || 5));

  function decompose(cal) {
    const week = Math.floor(cal / WEEK_HOURS);
    const r = cal - week * WEEK_HOURS;
    const day = Math.floor(r / 24);
    const hour = r - day * 24;
    return { week, day, hour };
  }

  function compose(week, day, hour) {
    return week * WEEK_HOURS + day * 24 + hour;
  }

  function snapToWorkStart(cal) {
    if (cal <= 0) return 0;
    let { week, day, hour } = decompose(cal);
    if (day >= dpw) { week++; day = 0; hour = 0; }
    if (hour >= workHoursPerDay) {
      day++;
      hour = 0;
      if (day >= dpw) { week++; day = 0; }
    }
    return compose(week, day, hour);
  }

  function addWorkDuration(startCal, nominalHours) {
    const actual = nominalHours / eff;
    let remaining = actual;
    let current = snapToWorkStart(startCal);

    while (remaining > 1e-9) {
      const { week, day, hour } = decompose(current);
      const avail = workHoursPerDay - hour;
      if (remaining <= avail + 1e-9) {
        return compose(week, day, hour + Math.min(remaining, avail));
      }
      remaining -= avail;
      let nextDay = day + 1;
      let nextWeek = week;
      if (nextDay >= dpw) { nextWeek++; nextDay = 0; }
      current = compose(nextWeek, nextDay, 0);
    }
    return current;
  }

  function getActualDuration(nominalHours) {
    return nominalHours / eff;
  }

  function splitWorkSegments(startCal, nominalHours) {
    const actual = nominalHours / eff;
    let remaining = actual;
    let current = snapToWorkStart(startCal);
    const segments = [];

    while (remaining > 1e-9) {
      const { week, day, hour } = decompose(current);
      const avail = workHoursPerDay - hour;
      const chunk = Math.min(remaining, avail);
      segments.push({
        startHour: current,
        endHour: compose(week, day, hour + chunk),
      });
      remaining -= chunk;
      if (remaining > 1e-9) {
        let nextDay = day + 1;
        let nextWeek = week;
        if (nextDay >= dpw) { nextWeek++; nextDay = 0; }
        current = compose(nextWeek, nextDay, 0);
      }
    }
    return segments;
  }

  return { snapToWorkStart, addWorkDuration, getActualDuration, splitWorkSegments, workHoursPerDay, eff, dpw };
}

function expandJobs(products) {
  const jobs = [];
  let jobId = 1;

  for (const product of products) {
    if (!Array.isArray(product.gamme) || product.gamme.length === 0) continue;
    const lots = Math.max(1, product.lots || 1);

    for (let lotIdx = 0; lotIdx < lots; lotIdx++) {
      const route = product.gamme
        .map(atelier => ({
          atelier,
          duration: product.processingTimes?.[atelier] || 0,
        }))
        .filter(s => s.duration > 0);

      if (route.length === 0) continue;

      jobs.push({
        id: `J${String(jobId++).padStart(4, '0')}`,
        productId: product.id,
        productName: product.name,
        color: product.color || '#3CC2B1',
        lotIndex: lotIdx,
        route,
        currentStep: 0,
        availableAt: 0,
        finished: false,
        priority: product.priority || 0,
        deliveryWeek: product.deliveryWeek || Infinity,
      });
    }
  }

  return jobs;
}

function initResources(calendars) {
  const resources = {};
  for (const a of ATELIERS) {
    resources[a] = {
      id: a,
      name: ATELIER_NAMES[a],
      availableAt: 0,
      lastProductId: null,
      consecutiveCount: 0,
      scheduled: [],
    };
  }
  return resources;
}

function hasPendingWork(jobs) {
  return jobs.some(j => !j.finished);
}

function buildCandidates(jobs, resources, calendars, cfg, horizon) {
  const candidates = [];

  for (const job of jobs) {
    if (job.finished) continue;
    if (job.currentStep >= job.route.length) {
      job.finished = true;
      continue;
    }

    const step = job.route[job.currentStep];
    const resource = resources[step.atelier];
    if (!resource) continue;

    const cal = calendars[step.atelier];
    const earliest = Math.max(job.availableAt, resource.availableAt);
    const startTime = cal.snapToWorkStart(earliest);

    if (startTime >= horizon) continue;

    const endTime = cal.addWorkDuration(startTime, step.duration);

    candidates.push({
      job,
      resource,
      stepIndex: job.currentStep,
      totalSteps: job.route.length,
      atelier: step.atelier,
      nominalDuration: step.duration,
      actualDuration: cal.getActualDuration(step.duration),
      startTime,
      endTime,
      score: 0,
    });
  }

  return candidates;
}

function scoreCandidates(candidates, jobs, resources, calendars, cfg, horizon) {
  const w = cfg.weights;
  const maxTime = Math.max(1, ...candidates.map(c => c.endTime));

  for (const c of candidates) {
    let score = 0;

    score += w.earliestStart * (1 - c.startTime / maxTime);

    const progress = c.stepIndex / Math.max(1, c.totalSteps - 1);
    score += w.progressBonus * progress;

    if (c.stepIndex + 1 < c.totalSteps) {
      const nextAtelier = c.job.route[c.stepIndex + 1].atelier;
      const wipCount = countWipAt(nextAtelier, jobs);
      if (wipCount >= cfg.maxWipPerStage) {
        score -= w.wipPenalty * (wipCount / cfg.maxWipPerStage);
      }
    }

    if (c.resource.lastProductId === c.job.productId) {
      const consecutive = c.resource.consecutiveCount;
      if (consecutive >= cfg.maxConsecutiveSameProduct) {
        const hasOther = candidates.some(
          other => other.atelier === c.atelier && other.job.productId !== c.job.productId
        );
        if (hasOther) {
          score -= w.diversityPenalty * (consecutive / cfg.maxConsecutiveSameProduct);
        }
      }
    }

    if (c.job.deliveryWeek < Infinity) {
      const deliveryHour = c.job.deliveryWeek * WEEK_HOURS;
      const slack = deliveryHour - c.endTime;
      if (slack < 0) {
        score += w.urgencyBonus * 2;
      } else if (slack < WEEK_HOURS) {
        score += w.urgencyBonus * (1 - slack / WEEK_HOURS);
      }
    }

    if (c.stepIndex + 1 < c.totalSteps) {
      const nextAtelier = c.job.route[c.stepIndex + 1].atelier;
      const nextRes = resources[nextAtelier];
      const nextCal = calendars[nextAtelier];
      if (nextRes) {
        const nextAvail = nextCal.snapToWorkStart(nextRes.availableAt);
        if (nextAvail <= c.endTime) {
          score += w.downstreamFit;
        }
      }
    }

    score += parseInt(c.job.id.slice(1)) * 0.00001;

    c.score = score;
  }
}

function countWipAt(atelier, jobs) {
  let count = 0;
  for (const job of jobs) {
    if (job.finished) continue;
    if (job.currentStep >= job.route.length) continue;
    if (job.route[job.currentStep].atelier === atelier && job.availableAt > 0) {
      count++;
    }
  }
  return count;
}

function commitOperation(candidate, resources, calendars, cfg) {
  const { job, resource } = candidate;

  const op = {
    id: job.id,
    productId: job.productId,
    productName: job.productName,
    color: job.color,
    lotIndex: job.lotIndex,
    atelier: candidate.atelier,
    atelierName: resource.name,
    stepIndex: candidate.stepIndex,
    totalSteps: candidate.totalSteps,
    startHour: candidate.startTime,
    endHour: candidate.endTime,
    duration: candidate.nominalDuration,
    actualDuration: candidate.actualDuration,
  };

  resource.availableAt = candidate.endTime;
  resource.scheduled.push(op);

  if (resource.lastProductId === job.productId) {
    resource.consecutiveCount++;
  } else {
    resource.lastProductId = job.productId;
    resource.consecutiveCount = 1;
  }

  job.availableAt = candidate.endTime;
  job.currentStep++;
  if (job.currentStep >= job.route.length) {
    job.finished = true;
  }

  return op;
}

function advanceTime(jobs, resources) {
  let earliest = Infinity;
  for (const job of jobs) {
    if (!job.finished && job.availableAt > 0) {
      earliest = Math.min(earliest, job.availableAt);
    }
  }
  for (const r of Object.values(resources)) {
    if (r.availableAt > 0) {
      earliest = Math.min(earliest, r.availableAt);
    }
  }
  if (earliest === Infinity || earliest === 0) {
    for (const job of jobs) {
      if (!job.finished) job.finished = true;
    }
    return false;
  }
  return true;
}

function formatOutput(scheduled, products, calendars) {
  const ateliersUsed = [...new Set(scheduled.map(o => o.atelier))].sort();
  const spanHours = Math.max(0, ...scheduled.map(o => o.endHour));

  const tasks = [];
  for (const op of scheduled) {
    const cal = calendars[op.atelier];
    const segs = cal.splitWorkSegments(op.startHour, op.duration);

    if (segs.length <= 1) {
      tasks.push({ ...op, segId: `${op.id}-${op.atelier}-${op.stepIndex}`, lots: 1 });
    } else {
      for (let i = 0; i < segs.length; i++) {
        tasks.push({
          ...op,
          segId: `${op.id}-${op.atelier}-${op.stepIndex}-s${i}`,
          startHour: segs[i].startHour,
          endHour: segs[i].endHour,
          segIndex: i,
          segCount: segs.length,
          lots: 1,
        });
      }
    }
  }

  return { tasks, ateliers: ateliersUsed, spanHours };
}
