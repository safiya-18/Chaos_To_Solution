export const ALLOWED_CATEGORIES = Object.freeze([
  'campus-life',
  'accessibility',
  'productivity',
  'civic-good',
  'interactive-media'
]);

export const DIFFICULTY_WEIGHT_MAP = Object.freeze({
  easy: 1,
  medium: 2,
  hard: 3
});

export const validateProblem = (problem) => {
  const errors = [];
  if (!problem.id || typeof problem.id !== 'string') errors.push(`Problem missing valid string id: ${JSON.stringify(problem)}`);
  if (!problem.title || typeof problem.title !== 'string') errors.push(`Problem ${problem.id} missing title`);
  if (!problem.description || typeof problem.description !== 'string') errors.push(`Problem ${problem.id} missing description`);
  if (!ALLOWED_CATEGORIES.includes(problem.category)) {
    errors.push(`Problem ${problem.id} has invalid category '${problem.category}'. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
  }
  if (!DIFFICULTY_WEIGHT_MAP[problem.difficulty]) {
    errors.push(`Problem ${problem.id} has invalid difficulty '${problem.difficulty}'.`);
  }
  if (problem.difficultyWeight !== DIFFICULTY_WEIGHT_MAP[problem.difficulty]) {
    errors.push(`Problem ${problem.id} difficultyWeight (${problem.difficultyWeight}) does not match difficulty '${problem.difficulty}' (${DIFFICULTY_WEIGHT_MAP[problem.difficulty]}).`);
  }
  if (!Array.isArray(problem.tags) || problem.tags.length === 0) {
    errors.push(`Problem ${problem.id} tags must be a non-empty array.`);
  }
  return errors;
};

export const validateRestriction = (restriction) => {
  const errors = [];
  if (!restriction.id || typeof restriction.id !== 'string') errors.push(`Restriction missing valid string id: ${JSON.stringify(restriction)}`);
  if (!restriction.name || typeof restriction.name !== 'string') errors.push(`Restriction ${restriction.id} missing name`);
  if (!restriction.rule || typeof restriction.rule !== 'string') errors.push(`Restriction ${restriction.id} missing rule`);
  if (!DIFFICULTY_WEIGHT_MAP[restriction.difficulty]) {
    errors.push(`Restriction ${restriction.id} has invalid difficulty '${restriction.difficulty}'.`);
  }
  if (restriction.difficultyWeight !== DIFFICULTY_WEIGHT_MAP[restriction.difficulty]) {
    errors.push(`Restriction ${restriction.id} difficultyWeight (${restriction.difficultyWeight}) does not match difficulty.`);
  }
  if (typeof restriction.requiresNetwork !== 'boolean') {
    errors.push(`Restriction ${restriction.id} requiresNetwork must be a boolean.`);
  }
  return errors;
};

export const validateResource = (resource) => {
  const errors = [];
  const validTypes = ['browser-api', 'public-api', 'local-dataset'];
  if (!resource.id || typeof resource.id !== 'string') errors.push(`Resource missing valid string id: ${JSON.stringify(resource)}`);
  if (!resource.name || typeof resource.name !== 'string') errors.push(`Resource ${resource.id} missing name`);
  if (!validTypes.includes(resource.type)) {
    errors.push(`Resource ${resource.id} invalid type '${resource.type}'. Must be one of: ${validTypes.join(', ')}`);
  }
  if (!resource.docsUrl || typeof resource.docsUrl !== 'string' || !resource.docsUrl.startsWith('http')) {
    errors.push(`Resource ${resource.id} docsUrl must be a valid HTTP/HTTPS URL.`);
  }
  if (typeof resource.offlineSupported !== 'boolean') {
    errors.push(`Resource ${resource.id} offlineSupported must be a boolean.`);
  }
  if (resource.type === 'public-api') {
    if (!resource.fallbackMockUrl || !resource.fallbackMockUrl.startsWith('/api/mock/')) {
      errors.push(`Public API Resource ${resource.id} must define fallbackMockUrl starting with '/api/mock/'.`);
    }
  } else {
    if (resource.fallbackMockUrl !== null) {
      errors.push(`Offline/Browser Resource ${resource.id} should have fallbackMockUrl: null.`);
    }
  }
  if (resource.difficultyWeight !== DIFFICULTY_WEIGHT_MAP[resource.difficulty]) {
    errors.push(`Resource ${resource.id} difficultyWeight does not match difficulty.`);
  }
  return errors;
};

export const validateDatasets = ({ problems, restrictions, resources }) => {
  const allErrors = [];

  // Check counts
  if (!Array.isArray(problems) || problems.length < 20) allErrors.push(`Expected >= 20 problems, got ${problems?.length || 0}`);
  if (!Array.isArray(restrictions) || restrictions.length < 15) allErrors.push(`Expected >= 15 restrictions, got ${restrictions?.length || 0}`);
  if (!Array.isArray(resources) || resources.length < 15) allErrors.push(`Expected >= 15 resources, got ${resources?.length || 0}`);

  // Check unique IDs
  const problemIds = new Set();
  problems?.forEach((p) => {
    if (problemIds.has(p.id)) allErrors.push(`Duplicate problem ID detected: ${p.id}`);
    problemIds.add(p.id);
    allErrors.push(...validateProblem(p));
  });

  const restrictionIds = new Set();
  restrictions?.forEach((r) => {
    if (restrictionIds.has(r.id)) allErrors.push(`Duplicate restriction ID detected: ${r.id}`);
    restrictionIds.add(r.id);
    allErrors.push(...validateRestriction(r));
  });

  const resourceIds = new Set();
  resources?.forEach((res) => {
    if (resourceIds.has(res.id)) allErrors.push(`Duplicate resource ID detected: ${res.id}`);
    resourceIds.add(res.id);
    allErrors.push(...validateResource(res));
  });

  // Category coverage check
  ALLOWED_CATEGORIES.forEach((cat) => {
    const count = problems?.filter((p) => p.category === cat).length || 0;
    if (count < 4) {
      allErrors.push(`Category '${cat}' has only ${count} problems (minimum required: 4).`);
    }
  });

  // Referential integrity check
  problems?.forEach((p) => {
    p.incompatibleRestrictions?.forEach((rId) => {
      if (!restrictionIds.has(rId)) {
        allErrors.push(`Problem ${p.id} references non-existent incompatibleRestriction '${rId}'`);
      }
    });
    p.incompatibleResources?.forEach((resId) => {
      if (!resourceIds.has(resId)) {
        allErrors.push(`Problem ${p.id} references non-existent incompatibleResource '${resId}'`);
      }
    });
  });

  restrictions?.forEach((r) => {
    r.incompatibleResources?.forEach((resId) => {
      if (!resourceIds.has(resId)) {
        allErrors.push(`Restriction ${r.id} references non-existent incompatibleResource '${resId}'`);
      }
    });
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};

export const calculateValidCombinations = (
  problems,
  restrictions,
  resources,
  options = { minDifficulty: 4, maxDifficulty: 6 }
) => {
  const { minDifficulty = 4, maxDifficulty = 6 } = options;
  const validCombinations = [];
  let totalTheoretical = 0;
  let excludedByIncompatibility = 0;
  let excludedByDifficulty = 0;

  for (const prob of problems) {
    for (const rest of restrictions) {
      for (const res of resources) {
        totalTheoretical++;

        // Check Problem - Restriction incompatibility
        if (prob.incompatibleRestrictions?.includes(rest.id)) {
          excludedByIncompatibility++;
          continue;
        }

        // Check Problem - Resource incompatibility
        if (prob.incompatibleResources?.includes(res.id)) {
          excludedByIncompatibility++;
          continue;
        }

        // Check Restriction - Resource incompatibility
        if (rest.incompatibleResources?.includes(res.id)) {
          excludedByIncompatibility++;
          continue;
        }

        // Composite difficulty
        const compositeScore = prob.difficultyWeight + rest.difficultyWeight + res.difficultyWeight;

        if (compositeScore < minDifficulty || compositeScore > maxDifficulty) {
          excludedByDifficulty++;
          continue;
        }

        validCombinations.push({
          problemId: prob.id,
          restrictionId: rest.id,
          resourceId: res.id,
          compositeScore
        });
      }
    }
  }

  return {
    totalTheoretical,
    validCount: validCombinations.length,
    excludedByIncompatibility,
    excludedByDifficulty,
    validCombinations
  };
};
