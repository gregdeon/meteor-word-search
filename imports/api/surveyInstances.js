// surveyInstances.js
// Collection for storing survey responses
// Contents:
// - survey_id: ID of the survey being answered
// - workflow_instance_id: ID of the workflow (to find the user/experiment)
// - responses: a list of responses to each question
// - time_started: time when the survey screen was loaded
// - time_finished: time when the survey was submitted

import {Meteor} from 'meteor/meteor'; 
import {Mongo} from 'meteor/mongo';

import {addOutputToInstance} from './workflowInstances.js';

export const SurveyInstances = new Mongo.Collection('surveyinstances', {
    idGeneration: 'MONGO',
});

if (Meteor.isServer) {
    Meteor.publish('surveyinstances', function surveyInstancePublication(){
        return SurveyInstances.find();
    });
    Meteor.publish('surveyinstances.id_list', function(id_list){
        return SurveyInstances.find({_id: {$in: id_list}});
    });
}

Meteor.methods({
    'surveys.addResponse'(survey_id, responses, time_started, time_finished, workflow_instance) {
        let survey_instance_id = SurveyInstances.insert({
            survey_id: survey_id,
            workflow_instance_id: workflow_instance._id,
            responses: responses,
            time_started: time_started,
            time_finished: time_finished,
        })

        addOutputToInstance(workflow_instance._id, workflow_instance.stage, survey_instance_id);
    }
})
