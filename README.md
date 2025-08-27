# Animated Tutorial
_User friendly tutorials and help documentation_

## Introduction
`Animated Tutorial` is a HTML5 canvas based project, which aims to allow the easy addition of user tutorials into any HTML web app.  Using it you can quickly add customised tutorials and help documentation to any application to help improve user friendliness and engagement while reducing support requests.  Currently, the project is a little basic, however, it should still be useful in a range of scenarios, and if not, feel free to contribute.

![Tutorial in action](https://prystopiastorage.blob.core.windows.net/media/AnimatedTutorial.gif)

## Usage
A basic tutorial can be created in 3 steps:

1. `const tutorial = new AnimatedTutorial(); //Create a new instance of the tutorial`
1. `tutorial.addStep(".test-control", "Text to display about Test control", 10); //Add a step to the tutorial`
1. `tutorial.run(); //instantly runs the tutorial`

Another approach exists where a tutorial can be created directly from a form, to achieve this replace step 2 above with the following line, passing in the selector for the form:

`tutorial.addForm("#frmTest");`

In order to specify the message and duration for each step, each component on the form can detail this information using the following attributes

1. `data-at-message="Example message" //defines the message to display for this control`
1. `data-at-duration="10"; //defines the duration for this control, this value is in seconds`

## Config

Config values can be passed into the `TutorialManager` class to change the look and feel of the tutorial.

1. `frameInterval` - number to specify the frame rate of the animations, defaults to 1000/60 (60 fps);
1. `transitionTimeS` - how long the transition between elements takes to complete (defaults to 100ms);
1. `cutout` - Shape used to highlight the elements on the screen.  Accepts one of two values, "Box" and "Oval", defaults to "Box";
1. `font` - Font used to display messages to the user, defaults to "19px Arial";
1. `overlayColour` - String value representing the colour the overlay should be, defaults to "rgba(100,100,100,0.8)";
1. `showTutorialOnce` - If set to true, checks for the existence of the tutorial key in Local Storage, skipping the tutorial if it is present.  Defaults to true
1. `tutorialIden` - If specified, sets a unique identifier for the tutorial to be stored in Local Storage as part of the key.  Defaults to "prys-at-seen" + current Url.
1. `allowSkip` - If true, adds a skip button to the bottom of the tutorial, allowing the user to close at any point.  This will not specify the Local Storage field as detailed above.
1.  `zIndex` - Specifies the defaulty z-index for the tutorial to display at, ensuring that it can cover any elements.


## Future plans
* Accessible help documentation for individual controls, without going through the entire tutorial
* Different animation types
* Addition of styling options to the displayed messages
* Internationalisation features