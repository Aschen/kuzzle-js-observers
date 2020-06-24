const { DocumentSearchResult, KuzzleEventEmitter } = require('kuzzle-sdk');
const Observer = require('./Observer');

class ObserverSearchResult extends DocumentSearchResult {

  /**
   * @param {Kuzzle} kuzzle
   * @param {object} request
   * @param {object} options
   * @param {object} response
   */
  constructor (kuzzle, request, options, response) {
    super(kuzzle, request, options, response);

    this.eventEmitter = new KuzzleEventEmitter();

    if (request.aggs || request.aggregations) {
      throw new Error('Aggregations are not supported for observers');
    }

    const hits = this.hits;
    this.hits = [];

    this.hits = hits.map(document => {
      const observer = new Observer(kuzzle, request.index, request.collection, document);

      observer.on('change', changes => {
        this.emit('change', observer._id, changes);
      });

      observer.on('delete', () => {
        this.emit('delete', observer._id,);
      });

      observer.on('error', error => {
        this.emit('error', observer._id, error);
      });

      return observer;
    });
  }

  set notifyOnly (value) {
    this.hits.forEach(observer => observer.notifyOnly = value);
  }

  start () {
    return Promise.all(this.hits.map(observer => observer.start()))
      .then(() => this);
  }

  stop () {
    return Promise.all(this.hits.map(observer => observer.stop()))
      .then(() => this);
  }

  _buildNextSearchResult (response) {
    const nextSearchResult = new this.constructor(this._kuzzle, this._request, this._options, response.result);

    nextSearchResult.fetched += this.fetched;

    return nextSearchResult.start();
  }

  /**
   * KuzzleEventEmitter bridge
   */
  emit (...args) {
    return this.eventEmitter.emit(...args);
  }

  on (...args) {
    return this.eventEmitter.on(...args);
  }
}

module.exports = ObserverSearchResult;
