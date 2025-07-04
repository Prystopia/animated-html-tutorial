"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimatedTutorial = exports.TutorialAnimationManager = exports.TutorialDrawingManager = exports.TutorialStep = exports.TutorialArgs = void 0;
var TutorialArgs = /** @class */ (function () {
    function TutorialArgs() {
        this.frameInterval = 1000 / 60;
        this.transitionTimeS = 100;
        this.cutout = "Box";
        this.font = "19px Arial";
        this.overlayColour = "rgba(100,100,100,0.8)";
    }
    return TutorialArgs;
}());
exports.TutorialArgs = TutorialArgs;
var TutorialStep = /** @class */ (function () {
    function TutorialStep() {
        this.control = null;
        this.stepMessage = null;
        this.durationS = 2;
        this.callback = null;
    }
    return TutorialStep;
}());
exports.TutorialStep = TutorialStep;
var TutorialDrawingManager = /** @class */ (function () {
    function TutorialDrawingManager() {
        this.canvas = null;
        this.ctx = null;
        this.args = null;
    }
    TutorialDrawingManager.prototype.initialise = function (args) {
        this.args = args;
        this.canvas = document.createElement("canvas");
        //TODO - needs to be configurable to ensure we don't sit under existing elements
        this.canvas.style.zIndex = "2";
        this.canvas.style.position = "fixed";
        this.canvas.setAttribute("width", "".concat(window.innerWidth, "px"));
        this.canvas.setAttribute("height", "".concat(window.innerHeight, "px"));
        this.canvas.style.display = "block";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.right = "0";
        this.canvas.style.bottom = "0";
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");
    };
    TutorialDrawingManager.prototype.createArc = function (x, y, rad) {
        if (this.ctx != null) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, rad, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.clip();
            this.clear();
            this.ctx.restore();
        }
    };
    TutorialDrawingManager.prototype.drawBackground = function () {
        this.clear();
        if (this.ctx != null && this.canvas != null && this.args != null) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.fillStyle = this.args.overlayColour;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    };
    TutorialDrawingManager.prototype.createCutoutBox = function (x, y, width, height) {
        //instead of just a straight circle we need to have a max height and width around the control we draw to and then use an oval, avoids having large controls with hugh circles
        if (this.ctx != null) {
            this.ctx.beginPath();
            this.ctx.moveTo(x - 5, y - 5);
            this.ctx.lineTo(x + width + 5, y - 5);
            this.ctx.lineTo(x + width + 5, y + 5 + height);
            this.ctx.lineTo(x - 5, y + 5 + height);
            this.ctx.stroke();
            this.ctx.clip();
            this.clear();
            this.ctx.restore();
        }
    };
    TutorialDrawingManager.prototype.drawMessage = function (x, y, message) {
        if (this.ctx != null && this.args != null) {
            var maxWidth = 500;
            //need to handle wrapping of text
            this.ctx.font = this.args.font;
            //break on spaces
            var words = message.split(" ");
            var lines = [words[0]];
            var lineIndex = 0;
            var count = 1;
            while (count < words.length) {
                var currentMessage = lines[lineIndex];
                var width = this.ctx.measureText("".concat(currentMessage, " ").concat(words[count]));
                //adding the new word pushes it over the boundary, so start a new line
                if ((width.width + 20) > maxWidth) {
                    lineIndex++;
                    lines[lineIndex] = words[count];
                }
                else {
                    lines[lineIndex] = "".concat(currentMessage, " ").concat(words[count]);
                }
                count++;
            }
            var textHeight = 25;
            var height = (textHeight * lines.length) + 25;
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.fillStyle = "#FFFFFF";
            this.ctx.strokeStyle = "#000000";
            var boxLeft = x;
            //check if width goes off the page
            if (x + maxWidth > window.innerWidth) {
                boxLeft = x - maxWidth;
            }
            var boxHeight = y;
            if (boxHeight + height > window.innerHeight) {
                //this message will overflow off the bottom of the screen
                boxHeight = y - height;
            }
            this.ctx.beginPath();
            this.ctx.moveTo(boxLeft, boxHeight);
            //this.ctx.lineTo(x + textWidth, y);
            //this.ctx.lineTo(x + textWidth, y + textHeight);
            this.ctx.lineTo(boxLeft + maxWidth, boxHeight);
            this.ctx.lineTo(boxLeft + maxWidth, boxHeight + height);
            this.ctx.lineTo(boxLeft, boxHeight + height);
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.fill();
            //me.ctx.fillRect(x,y, 250, 150);
            this.ctx.beginPath();
            this.ctx.fillStyle = "#000000";
            for (var i = 0; i < lines.length; i++) {
                this.ctx.fillText(lines[i], boxLeft + 10, boxHeight + 25 + (textHeight * i));
            }
            this.ctx.restore();
        }
    };
    TutorialDrawingManager.prototype.skipStep = function () {
        //store reference to timeout
        //clear current timout
        //increment index by one, call run method again
    };
    TutorialDrawingManager.prototype.clear = function () {
        if (this.ctx != null && this.canvas != null) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    };
    TutorialDrawingManager.prototype.destroy = function () {
        this.ctx = null;
        if (this.canvas != null) {
            document.body.removeChild(this.canvas);
        }
        this.canvas = null;
    };
    return TutorialDrawingManager;
}());
exports.TutorialDrawingManager = TutorialDrawingManager;
//TODO - Add in fadein/fadeout animation rather than a transition
var TutorialAnimationManager = /** @class */ (function () {
    function TutorialAnimationManager() {
        this.currentStep = 0;
        this.isTransitioning = false;
        this.timeToNext = 0;
        this.timeToNextStep = 0;
        this.args = new TutorialArgs();
        this.drawingManager = null;
    }
    TutorialAnimationManager.prototype.initialise = function (args) {
        this.args = args;
        this.drawingManager = new TutorialDrawingManager();
        this.drawingManager.initialise(args);
    };
    TutorialAnimationManager.prototype.scrollToElement = function (control, offset) {
        /*const visibleRange = (this.elementToFollow.nativeElement.clientHeight / this.elementToFollow.nativeElement.scrollHeight) * 100;
                //start from 100%;
              const top = 100 - ((this.elementToFollow.nativeElement.scrollTop / this.elementToFollow.nativeElement.scrollHeight) * 100);
              this.first = (Math.ceil((top) - Math.ceil(visibleRange)) - 1) + "%";
              this.second = Math.ceil((top) - Math.ceil(visibleRange)) + "%";
              this.third = (Math.ceil(top)) + "%";
              this.fourth = (Math.ceil(top) + 1) + "%"*/
        var parent = control.parentElement;
        //let immediateParent = control;
        var contTop = control.getBoundingClientRect().top;
        //need to find the containing control that is scrollable
        while (parent != null) {
            if (parent.clientHeight < parent.scrollHeight) {
                //this indicates that this element is scrollable
                break;
            }
            //immediateParent = parent;
            parent = parent.parentElement;
        }
        //scroll height - total height
        //client height - visible height
        if (parent != null) {
            var middle = parent.clientHeight / 2;
            //if parent scroll height is over half way of visible element then start scrolling
            if (contTop > middle) {
                //console.log(control, parent, "Control top", contTop, "parentHeight", parent.scrollHeight, parent.offsetHeight, parent.clientHeight, parent.scrollTop);
                //try to keep elements in the middle of the element
                //control top is within the hidden element, so need to get the percentage
                var maxScroll = (parent.scrollHeight - parent.clientHeight);
                var scrollOffset = (contTop - middle);
                //console.log(parent.scrollHeight - parent.clientHeight);
                //if scroll has reached the bottom
                if (Math.round(parent.scrollTop) >= maxScroll) {
                    scrollOffset = 0;
                }
                //scroll to  = scroll height + difference between middle and top of next element
                var scrollVal = parent.scrollTop + scrollOffset;
                //if we go over the item, just set it to the max
                if (scrollVal > maxScroll) {
                    scrollVal = maxScroll;
                }
                if (scrollVal > 0) {
                    //for the moment, use instant as there is a race condition between scrolling using browser methods
                    //and animation frames for this - believe this only happens if original scroll val is larger than max scroll 
                    //TODO - could just use instant scroll for that one scenario
                    //TODO - could use a LERP and manually set the scroll val to keep them in sync
                    parent.scrollTo({ top: scrollVal, behavior: "instant" });
                    return scrollOffset;
                }
            }
        }
        return 0;
    };
    TutorialAnimationManager.prototype.run = function (steps) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        (_a = this.drawingManager) === null || _a === void 0 ? void 0 : _a.drawBackground();
        var step = steps[this.currentStep];
        var x = 0, y = 0, width = 0, height = 0, mesX = 0, mesY = 0;
        if (step.control != null) {
            var control = document.querySelector(step.control);
            if (control != null) {
                var scrollAmount = this.scrollToElement(control, 50);
                var bounds = control.getBoundingClientRect();
                //need to position the circles better + centre better
                x = bounds.left; // + window.scrollX;
                //console.log(scrollAmount);
                console.log(scrollAmount);
                y = bounds.top - scrollAmount; //get height as proportion of height of parent then scroll to that position,  offset comes off height of scrollable div + window.scrollY;
                mesX = bounds.right;
                mesY = bounds.bottom;
                width = control.offsetWidth / 2;
                height = control.offsetHeight / 2;
            }
            else {
                console.error("Control ".concat(step.control, " cannot be found"));
            }
        }
        else {
            //if no control provided display a message centred on the screen
            x = mesX = (window.innerWidth / 2) - 250;
            y = mesY = (window.innerHeight / 2) - 150;
            width = 0;
            height = 0;
        }
        //if we are moving from one item to the next
        if (this.isTransitioning) {
            this.timeToNext -= (_c = (_b = this.args) === null || _b === void 0 ? void 0 : _b.frameInterval) !== null && _c !== void 0 ? _c : 0;
            if (this.timeToNext > 0) {
                var percentage = ((_e = (_d = this.args) === null || _d === void 0 ? void 0 : _d.transitionTimeS) !== null && _e !== void 0 ? _e : 0 - this.timeToNext) / ((_g = (_f = this.args) === null || _f === void 0 ? void 0 : _f.transitionTimeS) !== null && _g !== void 0 ? _g : 1);
                //TODO - add check for 0 index - shouldn't happen as we can't transition before having at least one step
                var previousStep = steps[this.currentStep - 1];
                var previousControl = previousStep.control ? document.querySelector(previousStep.control) : null;
                var prevX = previousControl ? previousControl.getBoundingClientRect().left : (window.innerWidth / 2);
                var prevY = previousControl ? previousControl.getBoundingClientRect().top : (window.innerHeight / 2);
                var x = this.lerp(prevX, x, percentage);
                var y = this.lerp(prevY, y, percentage);
                var prevWidth = previousControl ? previousControl.offsetWidth / 2 : 10;
                var prevHeight = previousControl ? previousControl.offsetHeight / 2 : 10;
                width = this.lerp(prevWidth, width, percentage);
                height = this.lerp(prevHeight, height, percentage);
                setTimeout(function () { return _this.run(steps); }, (_j = (_h = this.args) === null || _h === void 0 ? void 0 : _h.frameInterval) !== null && _j !== void 0 ? _j : 0);
            }
            else {
                this.isTransitioning = false;
            }
        }
        if (x && y && width && height) {
            if (this.args.cutout == "Box") {
                (_k = this.drawingManager) === null || _k === void 0 ? void 0 : _k.createCutoutBox(x, y, width * 2, height * 2);
            }
            else {
                (_l = this.drawingManager) === null || _l === void 0 ? void 0 : _l.createArc(x + width, y + height, width + 5);
            }
        }
        //if we aren't moving to the next step we need to render the message to the user
        if (!this.isTransitioning) {
            //messages all should show centrally
            /*x = (window.innerWidth / 2) - 250;
            y = (window.innerHeight / 2) - 150;
            width = 0;
            height = 0;*/
            //250 is the width of the message, 150 is the height
            //const mesY = (window.innerHeight / 2) - 150;
            //const messX = (window.innerWidth / 2) - 250;
            //this.drawingManager.drawMessage(x + ((width + 5) * 2), y, step.stepMessage);
            (_m = this.drawingManager) === null || _m === void 0 ? void 0 : _m.drawMessage(mesX, mesY, (_o = step === null || step === void 0 ? void 0 : step.stepMessage) !== null && _o !== void 0 ? _o : "");
            if (this.timeToNextStep <= 0) {
                if (steps[this.currentStep].callback != null) {
                    steps[this.currentStep].callback().then(function () {
                        var _a, _b, _c, _d;
                        //clear arc
                        _this.currentStep++;
                        if (_this.currentStep < steps.length) {
                            _this.isTransitioning = true;
                            _this.timeToNext = (_a = _this.args.transitionTimeS) !== null && _a !== void 0 ? _a : 0;
                            _this.timeToNextStep = steps[_this.currentStep].durationS * 1000;
                            setTimeout(function () { return _this.run(steps); }, (_c = (_b = _this.args) === null || _b === void 0 ? void 0 : _b.frameInterval) !== null && _c !== void 0 ? _c : 0);
                        }
                        else {
                            //need to remove the canvas if we have finished the process
                            //once we have reached the end of the steps we can just destroy without a timeout
                            (_d = _this.drawingManager) === null || _d === void 0 ? void 0 : _d.destroy();
                            return;
                        }
                    });
                }
            }
            else {
                //TODO - add in click to confirm as well as a countdown (?optional run mode?)
                //TODO - no need to render all frames, just keep the message on screen for the specified time
                setTimeout(function () { return _this.run(steps); }, this.timeToNextStep);
                this.timeToNextStep = 0;
            }
        }
    };
    TutorialAnimationManager.prototype.lerp = function (pos1, pos2, t) {
        return (1 - t) * pos1 + t * pos2;
    };
    return TutorialAnimationManager;
}());
exports.TutorialAnimationManager = TutorialAnimationManager;
var AnimatedTutorial = /** @class */ (function () {
    function AnimatedTutorial(args) {
        if (args === void 0) { args = null; }
        //TODO - add local storage check to se whether user has already completed the tutorial based on the provided id or route
        this.steps = [];
        this.args = null;
        this.animationManager = null;
        this.initialise(args);
    }
    AnimatedTutorial.prototype.initialise = function (args) {
        if (args === void 0) { args = null; }
        this.args = new TutorialArgs();
        if (args != null) {
            if (!!args.cutout) {
                this.args.cutout = args.cutout;
            }
            if (!!args.frameInterval) {
                this.args.frameInterval = args.frameInterval;
            }
            if (!!args.transitionTimeS) {
                this.args.transitionTimeS = args.transitionTimeS;
            }
            if (!!args.font) {
                this.args.font = args.font;
            }
            if (!!args.overlayColour) {
                this.args.overlayColour = args.overlayColour;
            }
        }
        //clear all current steps
        this.steps = [];
        this.animationManager = new TutorialAnimationManager();
        this.animationManager.initialise(this.args);
    };
    AnimatedTutorial.prototype.addStep = function (controlSelector, message, duration, callback) {
        if (duration === void 0) { duration = 2; }
        if (callback === void 0) { callback = null; }
        var step = {
            control: controlSelector,
            stepMessage: message,
            durationS: duration,
            callback: callback,
        };
        if (step.callback == null) {
            step.callback = function () { return Promise.resolve(); };
        }
        this.steps.push(step);
    };
    AnimatedTutorial.prototype.run = function () {
        if (this.animationManager != null) {
            this.animationManager.timeToNextStep = this.steps[0].durationS * 1000;
            this.animationManager.run(this.steps);
        }
    };
    return AnimatedTutorial;
}());
exports.AnimatedTutorial = AnimatedTutorial;
//# sourceMappingURL=animated-tutorial.js.map