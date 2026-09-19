const state = Object.freeze({
    closed: 0,
    open: 1,
    half_open: 2,
});

export class CircuitBreaker {
    private failureThreshold: number;
    private halfOpenThreshold: number;
    private cooldownMS: number;
    private logger: Console;
    private _state: number;
    private failures: number;
    private _lastFailureTime: number;
    private _halfOpenSuccesses: number;
    private _halfOpenAttempts: number;
    constructor(opts: { failureThreshold: number, halfOpenThreshold: number, cooldownMS: number, logger?: Console }) {
        this.failureThreshold = opts.failureThreshold || 10;
        this.halfOpenThreshold = opts.halfOpenThreshold || 10;
        this.cooldownMS = opts.cooldownMS || 30000;
        this.logger = opts.logger || console;

        this._state = state.closed;
        this.failures = 0
        this._lastFailureTime = 0;
        this._halfOpenSuccesses = 0;
        this._halfOpenAttempts = 0;
    }
    _cooldownElapsed() {
        return (Date.now() - this._lastFailureTime) > this.cooldownMS;
    }
    _transitionTo(newState: number) {
        const prev = this._state;
        this._state = newState;
        if (newState === state.half_open) {
            this._halfOpenAttempts = 0
            this._halfOpenSuccesses = 0;
            this.logger.info(`CircuitBreaker transitioned from state ${prev} to state ${newState}`);
        }
    }
    _openCircuit() {
        this._lastFailureTime = Date.now();
        this._transitionTo(state.open);
        this.logger.error(`CircuitBreaker is now open`, {
            failures: this.failures,
            cooldownMS: this.cooldownMS,
        });
    }
    _reset() {
        this.failures = 0;
        this._halfOpenAttempts = 0;
        this._halfOpenSuccesses = 0;
        this._transitionTo(state.closed);
    }

    get state() {
        if (this._state === state.open && this._cooldownElapsed()) {
            this._transitionTo(state.half_open);
        }
        return this._state;
    }
    allowRequest() {
        const currentState = this.state;
        if (currentState === state.closed) return true;
        if (currentState === state.half_open) {
            if (this._halfOpenAttempts < this.halfOpenThreshold) {
                this._halfOpenAttempts++;
                return true;
            }
            return false;
        }
        return false;
    }
    onSuccess() {
        if (this.state === state.half_open) {
            this._halfOpenSuccesses++;
            if (this._halfOpenSuccesses >= this.halfOpenThreshold) {
                this._reset();
                this.logger.info(`CircuitBreaker is now closed`);
            }
            return;
        }
        if (this.failures > 0) {
            this.failures = 0;
            this.logger.info(`CircuitBreaker is now closed`);
        }
    }
    onFailure() {
        if (this._state === state.half_open && this.failures >= this.failureThreshold) {
            this.logger.info(`half open threshold reached, circuit breaker is now open`);
            this._openCircuit();
            return;
        }
        this.failures++;
        this._lastFailureTime = Date.now();
        if (this.failures >= this.failureThreshold) {
            this._openCircuit();
        }
    }

    snapshot() {
        return {
            state: this._state,
            failures: this.failures,
            halfOpenAttempts: this._halfOpenAttempts,
            halfOpenSuccesses: this._halfOpenSuccesses,
            lastFailureTime: this._lastFailureTime,
        }
    }
}
