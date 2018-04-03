// App.jsx
// Main app view
import React, { Component } from 'react';
import {Meteor} from 'meteor/meteor';
import {withTracker} from 'meteor/react-meteor-data';

// API requirements
import {Workflows} from '../api/workflows.js';
import {WorkflowInstances} from '../api/workflowInstances.js';
import {Puzzles} from '../api/puzzles.js';
import {PuzzleInstances} from '../api/puzzleInstances.js';

// UI
import {Workflow} from './Workflow.jsx';
import {LoginForm} from './LoginForm.jsx';
import {WordSearchPuzzle} from './WordSearchPuzzle.jsx';

class App extends Component {
    render() {
        // Wait for db connections
        if(!this.props.ready) {
            return (
                <div>Loading...</div>
            );
        }

        // Log in if not logged in
        if(!this.props.user) {
            return (<LoginForm />);
        }

        // Debug
        let debug = false;
        if(debug) {   
            return (
                <div>
                    <WordSearchPuzzle 
                        puzzle={this.props.puzzle}
                        puzzleinstance={this.props.puzzleInstance}
                    />
                </div>
            );
        }

        // Show their workflow
        return (
            <Workflow
                workflow={this.props.workflow}
                workflowInstance={this.props.workflowInstance}
            />
        );
    }
}

export default withTracker(() => {
    const sub = [
        Meteor.subscribe('workflows'),
        Meteor.subscribe('workflowinstances'),
        Meteor.subscribe('coopworkflows'),
        Meteor.subscribe('consentforms'),
        Meteor.subscribe('surveys'),
        Meteor.subscribe('surveyinstances'),
        Meteor.subscribe('feedbackletters'),
        Meteor.subscribe('puzzles'),
        Meteor.subscribe('puzzleinstances'),
    ];

    // Check if ready by putting together subscriptions
    let all_ready = true;
    sub.map((sub_item) => {
        if(!sub_item.ready())
            all_ready = false;
    });

    return {
        ready: all_ready,
        user: Meteor.user(),

        // TODO: handle cases where there's more than one workflow
        // For now, assume there's only one
        workflow: Workflows.findOne(),
        workflowInstance: WorkflowInstances.findOne(),

        // TODO: remove these when done debugging
        puzzle: Puzzles.findOne(),
        puzzleInstance: PuzzleInstances.findOne(),
    };
})(App);
