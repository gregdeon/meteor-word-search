// surveyInstances.js
// Collection for storing survey responses
// Contents:
// - survey_id: ID of the survey being answered
// TODO: remove this
// - workflow_instance_id: ID of the workflow (to find the user/experiment)
// - responses: a list of responses to each question

import {Meteor} from 'meteor/meteor'; 
import {Mongo} from 'meteor/mongo';

export const SurveyInstances = new Mongo.Collection('surveyinstances', {
    idGeneration: 'MONGO',
});

if (Meteor.isServer) {
    Meteor.publish('surveyinstances', function surveyInstancePublication(){
        return SurveyInstances.find();
    });
}

Meteor.methods({
    'surveys.addResponse'(survey_id, workflow_instance_id, responses) {
        SurveyInstances.insert({
            survey_id: survey_id,
            // TODO: 
            workflow_instance_id: workflow_instance_id,
            responses: responses,
        })
    }
})
