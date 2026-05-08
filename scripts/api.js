/**
 * Wyrdness API Client
 *
 * A unified JavaScript client for accessing Wyrdness paranormal data.
 * Works in both browser and Node.js environments.
 *
 * @version 1.0.0
 * @license WTFPL
 *
 * Usage:
 *   const wyrd = new WyrdnessAPI();
 *   const bigfoot = await wyrd.getPhenomenon('bigfoot');
 *   const sightings = await wyrd.getSightings('bigfoot');
 *   const allPhenomena = await wyrd.listPhenomena();
 */

class WyrdnessAPI {
  /**
   * Create a WyrdnessAPI instance
   * @param {Object} options - Configuration options
   * @param {string} [options.org='wyrdness'] - GitHub organization name
   * @param {string} [options.branch='main'] - Default branch
   * @param {string} [options.token] - GitHub personal access token (optional, increases rate limits)
   * @param {boolean} [options.cache=true] - Enable response caching
   * @param {number} [options.cacheTTL=300000] - Cache TTL in ms (default 5 min)
   */
  constructor(options = {}) {
    this.org = options.org || 'wyrdness';
    this.branch = options.branch || 'main';
    this.token = options.token || null;
    this.cacheEnabled = options.cache !== false;
    this.cacheTTL = options.cacheTTL || 300000;

    this._cache = new Map();

    // Base URLs
    this.rawBase = `https://raw.githubusercontent.com/${this.org}`;
    this.apiBase = 'https://api.github.com';

    // Known phenomenon repositories (updated dynamically)
    this.knownRepos = [
      'bigfoot', 'aliens', 'jinn', 'ghosts', 'vampires', 'werewolves',
      'fairies', 'demons', 'mothman', 'loch-ness-monster', 'chupacabra',
      'haunted-places', 'bermuda-triangle', 'skinwalkers', 'cryptids'
    ];
  }

  // ===================
  // CORE FETCH METHODS
  // ===================

  /**
   * Internal fetch wrapper with caching and auth
   * @private
   */
  async _fetch(url, options = {}) {
    const cacheKey = url;

    // Check cache
    if (this.cacheEnabled && this._cache.has(cacheKey)) {
      const cached = this._cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }
      this._cache.delete(cacheKey);
    }

    // Build headers
    const headers = {
      'Accept': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    // Fetch
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      throw new WyrdnessAPIError(
        `Request failed: ${response.status} ${response.statusText}`,
        response.status,
        url
      );
    }

    const data = await response.json();

    // Cache response
    if (this.cacheEnabled) {
      this._cache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return data;
  }

  /**
   * Fetch raw file from GitHub
   * @private
   */
  async _fetchRaw(repo, path) {
    const url = `${this.rawBase}/${repo}/${this.branch}/${path}`;
    return this._fetch(url);
  }

  /**
   * Fetch from GitHub API
   * @private
   */
  async _fetchAPI(endpoint) {
    const url = `${this.apiBase}${endpoint}`;
    return this._fetch(url);
  }

  // ====================
  // PHENOMENON DATA API
  // ====================

  /**
   * Get full phenomenon data from api.json
   * @param {string} phenomenonId - Repository/phenomenon ID (e.g., 'bigfoot')
   * @returns {Promise<Object>} Full phenomenon data
   */
  async getPhenomenon(phenomenonId) {
    return this._fetchRaw(phenomenonId, 'api.json');
  }

  /**
   * Get phenomenon metadata only
   * @param {string} phenomenonId - Repository/phenomenon ID
   * @returns {Promise<Object>} Phenomenon metadata and basic info
   */
  async getPhenomenonMeta(phenomenonId) {
    const data = await this.getPhenomenon(phenomenonId);
    return {
      meta: data.meta,
      phenomenon: data.phenomenon,
      classification: data.classification
    };
  }

  /**
   * Get sightings for a phenomenon
   * @param {string} phenomenonId - Repository/phenomenon ID
   * @param {Object} [filters] - Optional filters
   * @param {string} [filters.startDate] - Filter sightings after this date
   * @param {string} [filters.endDate] - Filter sightings before this date
   * @param {string} [filters.country] - Filter by country
   * @param {string} [filters.credibility] - Filter by credibility (high/medium/low)
   * @returns {Promise<Array>} Array of sightings
   */
  async getSightings(phenomenonId, filters = {}) {
    const data = await this.getPhenomenon(phenomenonId);
    let sightings = data.sightings?.notable || [];

    // Apply filters
    if (filters.startDate) {
      sightings = sightings.filter(s =>
        s.date?.value >= filters.startDate
      );
    }
    if (filters.endDate) {
      sightings = sightings.filter(s =>
        s.date?.value <= filters.endDate
      );
    }
    if (filters.country) {
      sightings = sightings.filter(s =>
        s.location?.country?.toLowerCase() === filters.country.toLowerCase()
      );
    }
    if (filters.credibility) {
      sightings = sightings.filter(s =>
        s.credibility?.rating === filters.credibility
      );
    }

    return sightings;
  }

  /**
   * Get evidence for a phenomenon
   * @param {string} phenomenonId - Repository/phenomenon ID
   * @param {string} [type] - Filter by evidence type (physical/photographic/video/audio/trace)
   * @returns {Promise<Object|Array>} Evidence data
   */
  async getEvidence(phenomenonId, type = null) {
    const data = await this.getPhenomenon(phenomenonId);
    const evidence = data.evidence || {};

    if (type) {
      return evidence[type] || [];
    }
    return evidence;
  }

  /**
   * Get theories for a phenomenon
   * @param {string} phenomenonId - Repository/phenomenon ID
   * @param {string} [type] - Filter by theory type (paranormal/scientific/skeptical)
   * @returns {Promise<Object|Array>} Theories data
   */
  async getTheories(phenomenonId, type = null) {
    const data = await this.getPhenomenon(phenomenonId);
    const theories = data.theories || {};

    if (type) {
      return theories[type] || [];
    }
    return theories;
  }

  /**
   * Get distribution/hotspots for a phenomenon
   * @param {string} phenomenonId - Repository/phenomenon ID
   * @returns {Promise<Object>} Distribution data including hotspots
   */
  async getDistribution(phenomenonId) {
    const data = await this.getPhenomenon(phenomenonId);
    return data.distribution || {};
  }

  /**
   * Get sources/bibliography for a phenomenon
   * @param {string} phenomenonId - Repository/phenomenon ID
   * @returns {Promise<Array>} Array of source citations
   */
  async getSources(phenomenonId) {
    const data = await this.getPhenomenon(phenomenonId);
    return data.sources || [];
  }

  // =================
  // DISCOVERY API
  // =================

  /**
   * List all phenomenon repositories in the organization
   * @returns {Promise<Array>} Array of repository info objects
   */
  async listPhenomena() {
    const repos = await this._fetchAPI(`/orgs/${this.org}/repos?per_page=100`);

    // Filter out .github and other non-phenomenon repos
    const phenomenaRepos = repos.filter(repo =>
      !repo.name.startsWith('.') &&
      repo.name !== 'wyrdness.github.io'
    );

    return phenomenaRepos.map(repo => ({
      id: repo.name,
      name: repo.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      updated: repo.updated_at,
      topics: repo.topics
    }));
  }

  /**
   * Get all phenomena data (fetches api.json from all repos)
   * @param {boolean} [metaOnly=false] - Only fetch metadata, not full data
   * @returns {Promise<Array>} Array of phenomenon data objects
   */
  async getAllPhenomena(metaOnly = false) {
    const repos = await this.listPhenomena();
    const phenomena = [];

    for (const repo of repos) {
      try {
        const data = metaOnly
          ? await this.getPhenomenonMeta(repo.id)
          : await this.getPhenomenon(repo.id);
        phenomena.push({ repo: repo.id, ...data });
      } catch (err) {
        // Skip repos without api.json
        console.warn(`Could not fetch ${repo.id}: ${err.message}`);
      }
    }

    return phenomena;
  }

  /**
   * Search across all phenomena
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @param {string[]} [options.fields] - Fields to search in
   * @param {string} [options.category] - Filter by category
   * @returns {Promise<Array>} Search results
   */
  async search(query, options = {}) {
    const allData = await this.getAllPhenomena(true);
    const queryLower = query.toLowerCase();
    const fields = options.fields || ['name', 'aliases', 'description', 'tags'];

    let results = allData.filter(item => {
      // Category filter
      if (options.category && item.phenomenon?.category !== options.category) {
        return false;
      }

      // Text search
      const phenomenon = item.phenomenon || {};

      for (const field of fields) {
        const value = phenomenon[field];

        if (typeof value === 'string' && value.toLowerCase().includes(queryLower)) {
          return true;
        }

        if (Array.isArray(value)) {
          const found = value.some(v => {
            if (typeof v === 'string') return v.toLowerCase().includes(queryLower);
            if (typeof v === 'object' && v.name) return v.name.toLowerCase().includes(queryLower);
            return false;
          });
          if (found) return true;
        }

        if (field === 'description' && phenomenon.description) {
          const desc = phenomenon.description;
          if (desc.summary?.toLowerCase().includes(queryLower)) return true;
          if (desc.full?.toLowerCase().includes(queryLower)) return true;
        }
      }

      return false;
    });

    return results;
  }

  // ====================
  // GITHUB METADATA API
  // ====================

  /**
   * Get repository information
   * @param {string} phenomenonId - Repository/phenomenon ID
   * @returns {Promise<Object>} Repository metadata
   */
  async getRepoInfo(phenomenonId) {
    return this._fetchAPI(`/repos/${this.org}/${phenomenonId}`);
  }

  /**
   * Get repository contributors
   * @param {string} phenomenonId - Repository/phenomenon ID
   * @returns {Promise<Array>} Array of contributor objects
   */
  async getContributors(phenomenonId) {
    const contributors = await this._fetchAPI(
      `/repos/${this.org}/${phenomenonId}/contributors`
    );

    return contributors.map(c => ({
      username: c.login,
      avatar: c.avatar_url,
      profile: c.html_url,
      contributions: c.contributions
    }));
  }

  /**
   * Get open issues (sighting reports, corrections, etc.)
   * @param {string} phenomenonId - Repository/phenomenon ID
   * @param {Object} [filters] - Issue filters
   * @param {string[]} [filters.labels] - Filter by labels
   * @param {string} [filters.state='open'] - Issue state (open/closed/all)
   * @returns {Promise<Array>} Array of issues
   */
  async getIssues(phenomenonId, filters = {}) {
    const state = filters.state || 'open';
    const labels = filters.labels ? `&labels=${filters.labels.join(',')}` : '';

    const issues = await this._fetchAPI(
      `/repos/${this.org}/${phenomenonId}/issues?state=${state}${labels}`
    );

    return issues.map(issue => ({
      id: issue.number,
      title: issue.title,
      state: issue.state,
      labels: issue.labels.map(l => l.name),
      author: issue.user.login,
      created: issue.created_at,
      updated: issue.updated_at,
      url: issue.html_url,
      body: issue.body
    }));
  }

  /**
   * Get pending sighting reports
   * @param {string} phenomenonId - Repository/phenomenon ID
   * @returns {Promise<Array>} Array of pending sighting report issues
   */
  async getPendingSightings(phenomenonId) {
    return this.getIssues(phenomenonId, {
      labels: ['sighting', 'needs-review'],
      state: 'open'
    });
  }

  /**
   * Get recent commits/changes
   * @param {string} phenomenonId - Repository/phenomenon ID
   * @param {number} [count=10] - Number of commits to fetch
   * @returns {Promise<Array>} Array of commit objects
   */
  async getRecentChanges(phenomenonId, count = 10) {
    const commits = await this._fetchAPI(
      `/repos/${this.org}/${phenomenonId}/commits?per_page=${count}`
    );

    return commits.map(c => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message,
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url
    }));
  }

  // ================
  // UTILITY METHODS
  // ================

  /**
   * Clear the cache
   */
  clearCache() {
    this._cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      entries: this._cache.size,
      enabled: this.cacheEnabled,
      ttl: this.cacheTTL
    };
  }

  /**
   * Get available categories
   * @returns {Array} List of category constants
   */
  static getCategories() {
    return [
      { id: 'CRYPTID', name: 'Cryptids', description: 'Unknown creatures' },
      { id: 'UFO_UAP', name: 'UFOs/UAPs', description: 'Unidentified aerial phenomena' },
      { id: 'GHOST_HAUNTING', name: 'Ghosts & Hauntings', description: 'Spirits and hauntings' },
      { id: 'ENTITY_SPIRIT', name: 'Entities', description: 'Non-ghost spiritual entities' },
      { id: 'DEMON_ANGEL', name: 'Demons & Angels', description: 'Demonic/angelic beings' },
      { id: 'FAE_FOLKLORE', name: 'Fae & Folklore', description: 'Fairies and folklore creatures' },
      { id: 'UNDEAD', name: 'Undead', description: 'Vampires, revenants' },
      { id: 'SHAPESHIFTER', name: 'Shapeshifters', description: 'Werewolves, skinwalkers' },
      { id: 'PSYCHIC_PHENOMENA', name: 'Psychic Phenomena', description: 'ESP, telepathy, NDEs' },
      { id: 'LOCATION', name: 'Locations', description: 'Haunted/mysterious places' },
      { id: 'ANOMALY', name: 'Anomalies', description: 'Time slips, glitches' },
      { id: 'URBAN_LEGEND', name: 'Urban Legends', description: 'Modern folklore' }
    ];
  }
}

/**
 * Custom error class for API errors
 */
class WyrdnessAPIError extends Error {
  constructor(message, status, url) {
    super(message);
    this.name = 'WyrdnessAPIError';
    this.status = status;
    this.url = url;
  }
}

// =================
// EXPORTS
// =================

// ES Module export
export { WyrdnessAPI, WyrdnessAPIError };

// CommonJS export (for Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WyrdnessAPI, WyrdnessAPIError };
}

// Browser global
if (typeof window !== 'undefined') {
  window.WyrdnessAPI = WyrdnessAPI;
  window.WyrdnessAPIError = WyrdnessAPIError;
}
