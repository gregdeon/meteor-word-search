// These functions generally assume that word ordering is
// 0, 1, 2, ..., N-1: player 1
// N, N+1, N+2, ..., 2N-1: player 2
// etc


// Convert number of points into tiered reward
function getTieredReward(points) 
{
    // List of (number of points required, team reward in cents)
    // Must be in descending order
    // TODO: define this somewhere
    let tiers = [
        {points: 30, reward: 120},
        {points: 25, reward:  90},
        {points: 20, reward:  60},
        {points: 15, reward:  40},
        {points: 10, reward:  20},
        {points:  5, reward:  10},
    ];

    for(let i = 0; i < tiers.length; i++) {
        if(points >= tiers[i].points) {
            return tiers[i].reward;
        }
    }

    // Default when not enough 
    return 0;
}

// Get number of points from found list
// For now, 1 word = 1 point
// Returns number of words found and number of points (these are equal for now)
function getPoints(found_list, idxs) 
{
    let num_found = 0;
    for(let i = 0; i < idxs.length; i++)
    {
        let idx = idxs[i];
        if(found_list[idx])
            num_found += 1;
    }

    return {
        found: num_found,
        points: num_found
    };
}

// Get number of points for some number of players
// player_mask is a number in [0, 7]; the 3 bits mark whether to include
// players 1 (LSB), 2, and 3 (MSB)
function getPointsPlayers(instance, player_mask) 
{
    let found_list = instance.found;
    let words_per_player = found_list.length / 3;
    let idx_list = [];

    for(let i = 0; i < 3; i++) {
        let include_player = !!(player_mask >> i & 1);
        if(include_player) {
            for(let j = 0; j < words_per_player; j++) {
                idx_list.push(i * words_per_player + j);
            }
        }
    }

    return getPoints(found_list, idx_list);
}

function equalSplit(instance, score_mode) {
    let points_obj = getPointsPlayers(instance, 0b111);
    let total_reward = getTieredReward(points_obj.points);

    // Split: just divide equally
    let per_player = total_reward / 3;
    let ret = [per_player, per_player, per_player];
    return ret;
}

function proportionalSplit(instance, score_mode) {
    let total_points = getPointsPlayers(instance, 0b111);
    let total_reward = getTieredReward(total_points.points);
    let total_found = total_points.found;

    // If nobody found anything, split equally
    if(total_found === 0) {
        return equalSplit(instance, score_mode);
    }

    // Split proportionally
    var ret = [];
    for(var i = 0; i < 3; i++) {
        let found = getPointsPlayers(instance, 1 << i).found;
        ret.push(total_reward * found / total_found);
    }

    return ret;
}

// Shapley values
function shapleySplit(instance, score_mode) {
    // Get list of rewards for all coalitions
    let rewards = []
    for(let i = 0; i < 2**3; i++) {
        let points = getPointsPlayers(instance, i);
        let reward = getTieredReward(points.points);
        rewards.push(reward);
    }

    // Weights for Shapley values
    // TODO: could calculate these automatically
    let shapley_weights = [
        // P1
        [-2, 2, -1, 1, -1, 1, -2, 2],
        // P2
        [-2, -1, 2, 1, -1, -2, 1, 2],
        // P3
        [-2, -1, -1, -2, 2, 1, 1, 2],
    ];

    // Calculate final rewards
    let ret = [];
    for(let i = 0; i < 3; i++) {
        let ret_i = 0;
        for(let j = 0; j < rewards.length; j++) {
            ret_i += rewards[j] * shapley_weights[i][j];
        }
        ret.push(ret_i / 6);
    }

    return ret;
}

function unfairSplit(instance, score_mode) {
    let total_points = getPointsPlayers(instance, 0b111);
    let total_reward = getTieredReward(total_points.points);
    let total_found = total_points.found;

    // Find how many words each player got
    let found = [];
    for(let i = 0; i < 3; i++) {
        found.push(getPointsPlayers(instance, 1 << i).found);
    }

    // Find which player was the worst
    var worst_player = 0;
    for(var i = 1; i < 3; i++) {
        if(found[i] < found[worst_player]) {
            worst_player = i;
        }
    }



    // Split 50/25/25 with 40 for the worst
    var ret = [];
    for(var i = 0; i < 3; i++) {
        var proportion = (i === worst_player ? 0.5 : 0.25);
        ret.push(total_reward * proportion);
    }
    return ret;
}

function roundDown(split) {
    return split.map((r) => Math.floor(r));
}

export const RewardModes = {
    EQUAL: 0,
    PROPORTIONAL: 1,
    SHAPLEY: 2,
    UNFAIR: 3,

    DEBUG: -1,
};

// TODO: remove score_mode, maybe?
export function getRewards(instance, reward_mode, score_mode) {
    let found_list = instance.found;
    switch(reward_mode) {
        case RewardModes.EQUAL:
            return roundDown(equalSplit(instance, score_mode));

        case RewardModes.PROPORTIONAL:
            return roundDown(proportionalSplit(instance, score_mode));

        case RewardModes.SHAPLEY:
            return roundDown(shapleySplit(instance, score_mode));

        case RewardModes.UNFAIR:
            return roundDown(unfairSplit(instance, score_mode));

        case RewardModes.DEBUG:
            return [10, 20, 30];
    }
}