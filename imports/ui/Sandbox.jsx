import React, { Component } from 'react';
import {withTracker} from 'meteor/react-meteor-data';

import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Paper from '@material-ui/core/Paper';

import {ConsentForm} from './ConsentForm'
import {AudioTask, AudioTaskView, AudioTaskInput, PlaybackBar, ScrollingTranscript} from './AudioTask.jsx'
import {AudioTranscript, AudioTranscriptStatusBar, AudioTranscriptText, AudioTranscriptLegend, AudioTaskScoreScreen} from './AudioTaskScoreScreen.jsx'
import {DIFF_STATES} from '../api/audioInstances.js'
import {RewardDisplay, RewardQuestions} from './RewardForm.jsx'
import {SurveyQuestion, Survey} from './Survey'
import {QuestionTypes} from '../api/surveys.js';
import {FeedbackLetter} from './FeedbackLetter'
import {ProgressBar, WorkflowHeader} from './Workflow'

import {getSandboxAudio} from '../api/sandbox.js';

import './Sandbox.css'

function SandboxCategory(props) {
    return <ExpansionPanel style={{width:"100%"}}>
        <ExpansionPanelSummary>
            {props.title}
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
            <Paper style={{width:"100%"}}>
                {props.children}
            </Paper>
        </ExpansionPanelDetails>
    </ExpansionPanel>
}

function SandboxItem(props) {
    return <ExpansionPanel style={{width:"100%"}} expanded={true}>
        <ExpansionPanelSummary>
            {props.title}
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
            <div className="sandbox-item">
                {props.children}
            </div>
        </ExpansionPanelDetails>
    </ExpansionPanel>
}

class Sandbox extends Component {
    render() {
        if(!this.props.ready) {
            return <div>Subscribing to collections...</div>
        }

        // Word lists for score screen
        let word_lists = [
            // P1
            [
                {text: 'these', status: DIFF_STATES.CORRECT},
                {text: 'are', status: DIFF_STATES.INCORRECT},
                {text: 'some', status: DIFF_STATES.NOT_TYPED},
                {text: 'words', status: DIFF_STATES.CORRECT}
            ],
            // P2
            [
                {text: 'this', status: DIFF_STATES.CORRECT},
                {text: 'is', status: DIFF_STATES.CORRECT},
                {text: 'a', status: DIFF_STATES.CORRECT},
                {text: 'slightly', status: DIFF_STATES.CORRECT},
                {text: 'longer', status: DIFF_STATES.CORRECT},
                {text: 'list', status: DIFF_STATES.CORRECT},
                {text: 'of', status: DIFF_STATES.CORRECT},
                {text: 'words', status: DIFF_STATES.CORRECT},
                {text: 'which', status: DIFF_STATES.CORRECT},
                {text: 'is', status: DIFF_STATES.CORRECT},
                {text: 'mostly', status: DIFF_STATES.CORRECT},
                {text: 'correct', status: DIFF_STATES.NOT_TYPED},
            ],
            // P2
            [
                {text: 'this', status: DIFF_STATES.CORRECT},
                {text: 'list', status: DIFF_STATES.CORRECT},
                {text: 'of', status: DIFF_STATES.CORRECT},
                {text: 'words', status: DIFF_STATES.CORRECT},
                {text: 'is', status: DIFF_STATES.CORRECT},
                {text: 'not', status: DIFF_STATES.CORRECT},
                {text: 'as', status: DIFF_STATES.CORRECT},
                {text: 'long', status: DIFF_STATES.CORRECT},
            ]
        ]

        // Props for all audio tasks
        let audio_task_callbacks = {
            onTypedWord: console.log,
            restartAudio: (() => console.log("Clicked on Restart Audio")),
            startCountdown: (() => console.log("Clicked on Start Countdown")),
        }

        return <div className='sandbox-container'>
            <SandboxCategory title="Workflow">
                <SandboxItem title="Progress bar">
                    <ProgressBar num_stages={10} current_stage={2} />
                </SandboxItem>
                <SandboxItem title="Header">
                    <WorkflowHeader
                        username={"A0123456789ABCDEF"}
                        num_stages={10} 
                        current_stage={2}
                        bonus_cents={123}
                    />
                </SandboxItem>
            </SandboxCategory>

            <SandboxCategory title="Audio Task">
                <SandboxItem>
                    <button onClick={function(){Meteor.call('sandbox.resetAudio')}}>
                        Reset sandbox audio task
                    </button>
                </SandboxItem>
                <SandboxItem title="Full Task">
                    <AudioTask
                        audio_task={this.props.sandbox_audio.task}
                        audio_instance={this.props.sandbox_audio.instance}
                    />
                </SandboxItem>
                <SandboxCategory title="Individual Task Screens">
                    <SandboxItem title="Not Started">
                        <AudioTaskView
                            started_countdown={false}
                            countdown_time={3}
                            audio_clip_elapsed={0}
                            audio_clip_length={119}
                            words={[]}
                            {...audio_task_callbacks}
                        />
                    </SandboxItem>
                    <SandboxItem title="Counting Down">
                        <AudioTaskView
                            started_countdown={true}
                            countdown_time={3}
                            audio_clip_elapsed={0}
                            audio_clip_length={119}
                            words={[]}
                            {...audio_task_callbacks}
                        />
                    </SandboxItem>
                    <SandboxItem title="Playing">
                        <AudioTaskView
                            started_countdown={true}
                            countdown_time={0}
                            audio_clip_elapsed={61}
                            audio_clip_length={119}
                            words={["these", "are", "a", "few", "words", "that", "have", "been", "typed"]}
                            {...audio_task_callbacks}
                        />
                    </SandboxItem>
                </SandboxCategory>
                <SandboxItem title="Text Input">
                    <AudioTaskInput
                        onTypedWord={console.log}
                    />
                </SandboxItem>
                <SandboxItem title="Playback Bar">
                    <PlaybackBar
                        time_elapsed={61}
                        total_time={119}
                    />
                </SandboxItem>
                <SandboxItem title="Transcript">
                    <ScrollingTranscript 
                        words={["these", "are", "a", "few", "words", "that", "have", "been", "typed"]}
                    />
                </SandboxItem>
            </SandboxCategory>

            <SandboxCategory title="Audio Results">
                <SandboxItem title="Results Screen">
                    <AudioTaskScoreScreen
                        player_num={3}
                        word_lists={word_lists}
                        total_pay={30}
                        total_correct={61}
                        rewards={[5, 10, 15]}
                    />
                </SandboxItem>
                <SandboxCategory title="Transcript">
                    <SandboxItem title="Own Transcript">
                        <AudioTranscript
                            player_num={1}
                            is_user={true}
                            words={word_lists[2]}
                        />
                    </SandboxItem>
                    <SandboxItem title="Others' Transcript">
                        <AudioTranscript
                            player_num={1}
                            is_user={false}
                            words={word_lists[2]}
                        />
                    </SandboxItem>
                </SandboxCategory>
                <SandboxItem title="Status Bar">
                    <AudioTranscriptStatusBar 
                        num_words={30}
                        num_typed={25}
                        num_correct={19}
                    />
                </SandboxItem>
                <SandboxItem title="Transcript Text">
                    <AudioTranscriptText
                        words={word_lists[2]}
                    />
                </SandboxItem>
                <SandboxItem title="Legend">
                    <AudioTranscriptLegend
                    />
                </SandboxItem>
            </SandboxCategory>

            <SandboxCategory title="Reward Screen">
                <SandboxItem title="Reward Questions">
                    <RewardQuestions 
                        submit_callback={console.log}
                    />
                </SandboxItem>
                <SandboxCategory title="Reward Display">
                    <SandboxItem title="Reward display">
                        <RewardDisplay rewards={[20, 30, 50]} />
                    </SandboxItem>
                    <SandboxItem title="Reward display with 0">
                        <RewardDisplay rewards={[5, 0, 22]} />
                    </SandboxItem>
                    <SandboxItem title="Reward display with small percentages">
                        <RewardDisplay rewards={[2, 5, 50]} />
                    </SandboxItem>
                </SandboxCategory>
            </SandboxCategory>

            <SandboxCategory title="Consent Form">
                <ConsentForm 
                    consentform={{
                        text: ["This is an example of a paragraph.", "This is another paragraph."]
                    }}
                    finishedCallback={function(){console.log("Finished consent form")}}
                />
            </SandboxCategory>

            <SandboxCategory title="Survey">
                <SandboxItem title="Full survey">
                    <Survey
                        survey={{
                            title: "Survey Example with a Long Title",
                            questions: [
                                {text: "Question 1", type: QuestionTypes.TEXT_SHORT, required: true},
                                {text: "Question 2", type: QuestionTypes.TEXT_LONG, required: true},
                                {text: "Question 3", type: QuestionTypes.MULTIPLE_CHOICE, options:["Option 1", "Option 2"], required: true},
                            ]
                        }}
                        finishedCallback={console.log}
                    />
                </SandboxItem>
                <SandboxCategory title="Question Types">
                    <SandboxItem title="Short text question">
                        <SurveyQuestion 
                            text="Sample question"
                            type={QuestionTypes.TEXT_SHORT}
                            updateCallback={console.log}
                        />
                    </SandboxItem>                     
                    <SandboxItem title="Long text question">
                        <SurveyQuestion 
                            text="Sample question with long text"
                            type={QuestionTypes.TEXT_LONG}
                            updateCallback={console.log}
                        />
                    </SandboxItem>     
                    <SandboxItem title="Multiple choice question">
                        <SurveyQuestion 
                            text="Sample question with multiple options"
                            type={QuestionTypes.MULTIPLE_CHOICE}
                            options={["First option", "Another option"]}
                            updateCallback={console.log}
                        />
                    </SandboxItem>                
                    <SandboxItem title="Required question">
                        <SurveyQuestion 
                            text="Sample question"
                            type={QuestionTypes.TEXT_SHORT}
                            required={true}
                        />
                    </SandboxItem>
                </SandboxCategory>
            </SandboxCategory>

            <SandboxCategory title="Feedback Letter">
                <FeedbackLetter 
                    feedbackLetter={{
                        text: ["This is an example of a paragraph.", "This is another paragraph."]
                    }}
                    confirmCode={"ABC123"}
                />
            </SandboxCategory>

            <SandboxCategory title="Nested Example">
                <SandboxCategory title="Nested Menu">
                    <div style={{width:"100%"}}>Child</div>
                </SandboxCategory>
            </SandboxCategory>
        </div>
    }
}

export default withTracker(() => {
    const sub = [
        Meteor.subscribe('audiotasks'),
        Meteor.subscribe('audioinstances'),
    ];

    // Check if ready by putting together subscriptions
    let all_ready = true;
    sub.map((sub_item, idx) => {
        if(!sub_item.ready())
        {
            all_ready = false;
        }
    });

    return {
        ready: all_ready,
        sandbox_audio: getSandboxAudio(),
    };
})(Sandbox);
