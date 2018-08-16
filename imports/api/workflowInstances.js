// workflowInstances.js
// Collection for describing user's progress in a workflow steps
// Contents:
// - user_id: reference to user
// - workflow_id: reference to workflow
// - stage: current stage of the user
// - output: list of IDs of stage instances (task instances, survey instances, etc)
//   (note: output list doesn't include all stage types. TODO.)
// - assign_id: MTurk assignment ID
// - confirm_code: UUID for confirmation code

import {Meteor} from 'meteor/meteor'; 
import {Mongo} from 'meteor/mongo';
import {Random} from 'meteor/random';

import {incrementCounter} from 'meteor/konecty:mongo-counter';

import {Workflows, WorkflowStages} from './workflows.js';
import {getRewards} from './scoreFunctions.js';
import {Puzzles} from './puzzles.js';
import {PuzzleInstances} from './puzzleInstances.js';
import {AudioInstances} from './audioInstances.js';
import {createAudioRatingInstance} from './audioRatingInstances.js';

import {Counters} from './utils.js';

export const WorkflowInstances = new Mongo.Collection('workflowinstances', {
    idGeneration: 'MONGO',
});

if (Meteor.isServer) {
    Meteor.publish('workflowinstances', function(){
        // If they're logged in, show their instances
        if(this.userId) {
            return WorkflowInstances.find({user_id: this.userId});
        }
        else {
            return this.ready();
        }
    });
}

// TODO: maybe handle this counter ourselves
const getWorkflowCounter = function() {
    return incrementCounter(Counters, 'workflow_instances')
}

export function getWorkflowProgress(instance) {
    let workflow = Workflows.findOne({_id: instance.workflow_id});
    let done = 0;
    let total = 0;
    workflow.stages.map((stage, idx) => {
        switch(stage.type) {
            case WorkflowStages.CONSENT:
            case WorkflowStages.SURVEY:
            case WorkflowStages.FEEDBACK:
            case WorkflowStages.TUTORIAL:
            case WorkflowStages.AUDIO_RATING:
                total += 1;
                if(instance.stage > idx)
                    done += 1;
                break;
        }
    })

    return {
        done: done,
        // Don't count the very last step
        total: total-1,
    };
}

export function getWorkflowEarnings(instance, user_id) {
    let base = 0;
    let bonus = 0;

    getWorkflowEarnings

    console.log(user_id);

    // TODO: this function assumes that the regular workflow is worth nothing
    // TODO: port this code from coop workflows to regular workflows
    /*
    if(coop_instance) {
        let player_num = getPlayerNumber(user_id, coop_instance);
        let coop_workflow = CoopWorkflows.findOne({_id: coop_instance.coop_id});
        if(coop_instance.ready_state == 2) {
            coop_workflow.stages.map((stage, idx) => {
                let rewards = [0, 0, 0]
                // No money for stages we haven't done yet
                if(idx >= coop_instance.stage)
                    return;

                switch(stage.type) {
                    case CoopWorkflowStages.PUZZLE:
                        let puzzle_instance_id = coop_instance.output[idx];
                        let puzzle_instance = PuzzleInstances.findOne(puzzle_instance_id);
                        let puzzle = Puzzles.findOne(puzzle_instance.puzzle);
                        rewards = getRewards(
                            puzzle_instance,
                            puzzle.reward_mode,
                            puzzle.score_mode,
                        )
                        console.log(rewards);
                        console.log(player_num);

                        // TODO: don't assume 50 cents
                        base += 50;
                        bonus += rewards[player_num];
                        break;

                    case CoopWorkflowStages.AUDIO:
                        let audio_id = coop_instance.output[idx];
                        let audio_instance = AudioInstances.findOne(audio_id);
                        rewards = audio_instance.bonuses;

                        base += 25;
                        bonus += rewards[player_num];
                        break;
                }
            });
        }
    }

    */
    return {
        base: base,
        bonus: bonus,
    };
}

Meteor.methods({
    'workflowinstances.setUpWorkflow'(user_id) {
        // DEBUG
        console.log("Making workflow instance for " + user_id);

        // Try to find an instance for them
        let instance = WorkflowInstances.findOne({
            user_id: user_id,
            //workflow_id: workflow._id,
        });

        // They have one, so 
        if(instance) {
            return;
        }
        
        // None exist, so make a new one instead
        // Find the workflow that they should use
        let num_workflows = Workflows.find().count();
        let workflow_num = (getWorkflowCounter() - 1) % num_workflows;
        let workflow = Workflows.findOne({}, {sort: ['number'], skip: workflow_num});
        console.log(workflow_num);



        // Build output list
        // TODO: this should be more generic instead of a switch-case
        let output_list = [];
        for(let i = 0; i < workflow.stages.length; i++) {
            let stage = workflow.stages[i];
            let output_id = null;
            switch(stage.type) {
                case WorkflowStages.AUDIO_RATING:
                    let task_id = stage.id;
                    output_id = createAudioRatingInstance(task_id);
                    break;
            }

            output_list.push(output_id);
        }
        
        // Add instance to the database
        WorkflowInstances.insert({
            user_id: user_id,
            workflow_id: workflow._id,
            stage: 0,
            output: output_list,
            confirm_code: null,
        })

        // No need to return - props will get updated right away
    },

    'workflowinstances.advanceStage'(instance_id) {
        let instance = WorkflowInstances.findOne({_id: instance_id});
        let workflow = Workflows.findOne({_id: instance.workflow_id});

        let stage = instance.stage;
        let new_stage = stage + 1;
        let num_stages = workflow.stages.length;

        if(new_stage < num_stages) {
            let upd = {stage: new_stage};

            // Generate a confirmation code on the final stage
            if(new_stage === num_stages - 1) {
                // We can't actually generate one on the client-side
                if(this.isSimulation) {
                    upd.confirm_code = "Generating, please wait...";
                } 
                else {
                    upd.confirm_code = Random.id();
                }
            }

            WorkflowInstances.update(instance_id, {
                $set: upd
            });
        }
    },
});