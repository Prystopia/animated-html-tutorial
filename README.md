# Animated Tutorial
_User friendly tutorials and help documentation_

## Introduction
`Animated Tutorial` is a HTML5 canvas based project, which aims to allow the easy addition of user tutorials into any HTML web app.  Using it you can quickly add customised tutorials and help documentation to any application to help improve user friendliness and engagement while reducing support requests.  Currently, the project is a little basic, however, it should still be useful in a range of scenarios, and if not, feel free to contribute.

![Tutorial in action](https://prystopiastorage.blob.core.windows.net/media/Animated-Tutorial.gif)

## Usage

In the interest of getting feedback as soon as possible, whilst some of the other features are being worked on the project currently consists of a single `.ts` file, which can be copied and put into your project.

A tutorial can be created in 3 steps:

1. `const tutorial = new AnimatedTutorial(); //Create a new instance of the tutorial`
1. `tutorial.addStep(".test-control", "Text to display about Test control", 10); //Add a step to the tutorial`
1. `tutorial.run(); //instantly runs the tutorial`

For complex or dynamic forms, this can quickly become unweildy and difficult to use

## Config

Config values can be passed into the `TutorialManager` class to change the look and feel of the tutorial.

1. `frameInterval` - number to specify the frame rate of the animations, defaults to 1000/60 (60 fps);
1. `transitionTimeS` - how long the transition between elements takes to complete (defaults to 100ms);
1. `cutout` - Shape used to highlight the elements on the screen.  Accepts one of two values, "Box" and "Oval", defaults to "Box";
1. `font` - Font used to display messages to the user, defaults to "19px Arial";
1. `overlayColour` - String value representing the colour the overlay should be, defaults to "rgba(100,100,100,0.8)";


## Future plans
* Accessible help documentation for individual controls, without going through the entire tutorial
* Auto recognition of whether a user has already seen the tutorial for a particular page
* Different animation types
* Addition of styling options to the displayed messages
* Auto initialise from Forms
* Optional "Skip" and "Next" buttons to allow users to navigate through the process
* Internationalisation features

