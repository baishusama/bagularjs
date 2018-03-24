'use strict';

var _ = require('lodash');

function initWatchVal() {}

function Scope() {
    // 初始化
    this.$$watchers = [];
    this.$$lastDirtyWatch = null;
}
Scope.prototype.$watch = function(watchFn, listenerFn, valueEq) {
    var self = this;
    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || function() {},
        last: initWatchVal,
        valueEq: !!valueEq
    };
    self.$$watchers.push(watcher); // !!: instead of unshift
    self.$$lastDirtyWatch = null; // 防止新添加的 watcher 被短路

    return function() {
        var index = self.$$watchers.indexOf(watcher);
        if (index >= 0) {
            /**
             * `if` to avoid more than one call
             *   - 1st call, watch found => index >= 0
             *   - 2nd call, watch not found => index === -1
             * & NOTE: how will `splice` behave when index === -1
             */
            // !!: instead of `splice`ing here, `splice` in the end of $digest
            self.$$watchers[index] = null;
        }
    };
};
Scope.prototype.$$areEqual = function(newValue, oldValue, valueEq) {
    if (valueEq) {
        return _.isEqual(newValue, oldValue);
    } else {
        return (
            newValue === oldValue ||
            (typeof newValue === 'number' &&
                typeof oldValue === 'number' &&
                isNaN(newValue) &&
                isNaN(oldValue)) // isNaN()
        );
    }
};
Scope.prototype.$$digestOnce = function() {
    var self = this;
    var newValue, oldValue, dirty;
    _.forEach(self.$$watchers, function(watcher) { // !!: instead of forEachRight
        try {
            if (watcher) {
                newValue = watcher.watchFn(self);
                oldValue = watcher.last;
                if (!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {
                    dirty = true;
                    self.$$lastDirtyWatch = watcher;
                    watcher.last = watcher.valueEq
                        ? _.cloneDeep(newValue)
                        : newValue;
                    watcher.listenerFn(
                        newValue,
                        oldValue === initWatchVal ? newValue : oldValue,
                        self
                    );
                } else if (watcher === self.$$lastDirtyWatch) {
                    return false;
                }
            }
        } catch (e) {
            console.log(e);
        }
    });
    return dirty || false;
};
Scope.prototype.$digest = function() {
    var ttl = 10;
    var dirty;
    this.$$lastDirtyWatch = null; // 每个 digest 周期开始的时候，重置
    do {
        dirty = this.$$digestOnce();
        // 10 $$digestOnce called but still dirty..
        if (dirty && !--ttl) {
            // ! before --
            throw '10 digest iterations reached'; // new Error('..oops there is an infinite loop!');
        }
    } while (dirty);
    /**
     * !!: 在遍历完之后，对 $$watchers 做清理（真正的 splice）
     * 这样就不会有 由于数组错位引起 的各种 corner case，也更便于理解
     */
    var self = this;
    _.forEachRight(self.$$watchers, function(watcher, index){
        if(!watcher){
            self.$$watchers.splice(index, 1);
        }
    });
};

module.exports = Scope;
