// Description:
//   This description shows up in the /help command
//
// Commands:
//   hubot sotw create "<question>" - create new sotw in progress for the channel, ex. `sotw create "Song of the Week 2020-01-01 Theme: hubot"`
//   hubot sotw add option "<option>" - add an option to a sotw currently in progress, ex. `sotw add option "some option"`
//   hubot sotw update option <letter> "<new option>" - update option to a sotw currently in progress, ex. `sotw update option b "new option value"`
//   hubot sotw preview - preview a sotw currently in progress for the channel
//   hubot sotw done - finish and activate a sotw currently in progress, only the creator may take this action
//   hubot sotw vote <sotw number> <option letter> - vote on a sotw, ex. `sotw vote 1 a`, self votes are disallowed
//   hubot sotw list - (public or pm) lists all existing sotws
//   hubot sotw show <sotw number> - (public or pm) show details for a single sotw, ex. `hubot sotw show 1`
//   hubot sotw results <sotw number> - (public or pm) list results for a single sotw (public or private), ex. `hubot sotw results 1`

module.exports = function(robot) {
  var noSotWInProgressMsg = 'There is currently no sotw in progress. To create a new one, say `hubot sotw create "Song of the Week YYYY-MM-DD theme"`.';

  var getUsername = function(msg) {
    return msg.message.user.name;
  };

  var isPrivateMsg = function(msg) {
//    return msg.message.room === msg.message.user.name;
      return true;
  };

  /**
   * find a sotw by id
   *
   * @param {number} id
   * @return {object|undefined}
   */
  var find = function(id) {
    var sotws = robot.brain.get('sotws') || [];
    var sotw = sotws.filter(function(sotw) {
      return sotw.id === id;
    })[0];
    return sotw;
  };

  /**
   * print out sotw question, options, and instructions for voting
   *
   * @param {object} sotw
   * @param {object} msg - hubot msg object
   * @param {boolean} showScores - whether to show the score for each option
   */
  var printSotW = function(sotw, msg, showScores) {
    msg.send(sotw.id + '. ' + sotw.question + ' (created by ' + sotw.author + ')');
    msg.send('options:');
    var optionsStr = '';
    sotw.options.forEach(function(option, idx) {
      var label = String.fromCharCode(idx + 97); // map option idx to alpha letters
      var optionStr = label + '. ' + option.author + ' - ' + option.name;
      if (showScores) {
        optionStr += ' (' + option.score + ')';
      }
      optionsStr += optionStr;
      optionsStr += '\n';
    });
    msg.send(optionsStr);
    msg.send('To vote on this sotw, private message me `sotw vote [number] [option letter]`, e.g., `sotw vote 1 a`. To see results for this sotw, say `sotw results [number]`.');
  };

  robot.hear(/sotw create "(.+)"/i, function(msg) {
    if (isPrivateMsg(msg)) {
      var question = msg.match[1];
      var author = getUsername(msg);
      var channel = msg.message.room;

      var sotws = robot.brain.get('sotws_in_progress') || {};
      var sotw = sotws[channel];

      if (typeof sotw === 'object') {
        msg.send('You already have a sotw in progress. Say `sotw add option "[option]"` (option in quotation marks) to add an option to your current sotw. Say `sotw done` to finish and activate the sotw.');
      } else if (typeof sotw === 'undefined') {
        var newSotW = {
          channel: channel,
          author: author,
          question: question
        };
        sotws[channel] = newSotW;
        robot.brain.set('sotws_in_progress', sotws);

        msg.send('Created sotw ' + '"' + question + '". Say `sotw add option "[option]"` to add an option to the current in-progress sotw. Say `sotw done` to finish and activate the sotw.');
      }
    }
  });

  robot.hear(/sotw update option ([A-Za-z]) "(.+)"/i, function(msg) {
    if (isPrivateMsg(msg)) {
      var newOptionName = msg.match[2];
      var author = getUsername(msg);
      var channel = msg.message.room;
      var sotws = robot.brain.get('sotws_in_progress') || {};
      var sotw = sotws[channel];

      if (typeof sotw === 'object') {
        var optionLabel = msg.match[1];
        var optionIdx = optionLabel.charCodeAt() - 97;
        if (typeof sotw.options === 'undefined' || typeof sotw.options[optionIdx] === 'undefined') {
          msg.send('I couldn\'t find that option for the current SotW.');
          return;
        }

        if (sotw.options[optionIdx].author != author) {
          msg.send('You may not modify an option you did not create, ' + author);
        } else {
          sotw.options[optionIdx] = { name: newOptionName, author: author, score: 0 };
          msg.send('You\'ve updated option ' + optionLabel + ' to "' + newOptionName + '" on sotw "' + sotw.question + '"');
          robot.brain.set('sotws', sotws);
        }
    }
  }
});

  robot.hear(/sotw delete option ([A-Za-z])/i, function(msg) {
    if (isPrivateMsg(msg)) {
      var author = getUsername(msg);
      var channel = msg.message.room;
      var sotws = robot.brain.get('sotws_in_progress') || {};
      var sotw = sotws[channel];

      if (typeof sotw === 'object') {
        var optionLabel = msg.match[1];
        var optionIdx = optionLabel.charCodeAt() - 97;
        if (typeof sotw.options === 'undefined' || typeof sotw.options[optionIdx] === 'undefined') {
          msg.send('I couldn\'t find that option for the current SotW.');
          return;
        }

        if (sotw.author != author) {
          msg.send('You may not delete an option for a poll you did not create, ' + author);
        } else {
          sotw.options.splice(optionIdx, 1);
          msg.send('You\'ve deleted option ' + optionLabel + ' from  SotW "' + sotw.question + '"');
          robot.brain.set('sotws', sotws);
        }
    }
  }
});


  robot.hear(/sotw add option "(.+)"/i, function(msg) {
    if (isPrivateMsg(msg)) {
      var newOptionName = msg.match[1];
      var author = getUsername(msg);
      var channel = msg.message.room;

      var sotws = robot.brain.get('sotws_in_progress') || {};
      var sotw = sotws[channel];

      if (typeof sotw === 'object') {
        sotw.options = sotw.options || [];
        var newOption = { name: newOptionName, author: author, score: 0 };
        sotw.options.push(newOption);
        robot.brain.set('sotws_in_progress', sotws);
        msg.send('You added option "' + newOptionName + '" to sotw "' + sotw.question + '". Add another option, or say `sotw preview` or `sotw done`.');
      } else if (typeof sotw === 'undefined') {
        msg.send(noSotWInProgressMsg);
      }
    }
  });

  robot.hear(/sotw preview/i, function(msg) {
    if (isPrivateMsg(msg)) {
      var author = getUsername(msg);
      var channel = msg.message.room;
      var sotws = robot.brain.get('sotws_in_progress') || {};
      var sotw = sotws[channel];

      if (typeof sotw === 'object') {
        msg.send(sotw.question + ' (created by ' + sotw.author + ')');
        msg.send('options:');
        var optionsStr = '';
        if (sotw.options && sotw.options.length > 0) {
          sotw.options.forEach(function(option, idx) {
            var label = String.fromCharCode(idx + 97);
            var optionStr = label + '. ' + option.author + ' - ' + option.name;
            optionsStr += optionStr;
            optionsStr += '\n';
          });
          msg.send(optionsStr);
        } else {
          msg.send('No options yet.');
        }
      } else if (typeof sotw === 'undefined') {
        msg.send(noSotWInProgressMsg);
      }
    }
  });

  robot.hear(/sotw done/i, function(msg) {
    if (isPrivateMsg(msg)) {
      var author = getUsername(msg);
      var channel = msg.message.room;
      var sotwsInProgress = robot.brain.get('sotws_in_progress') || {};
      var sotw = sotwsInProgress[channel];

      if (typeof sotw === 'object') {
        if (sotw.author != author) {
          msg.send('Only ' + sotw.author + ' may close submissions and enable voting on "' + sotw.question +'"');
        } else {
          // increment max ID
          var maxID = robot.brain.get('sotws_max_id') || 0;
          var id = maxID + 1;
          robot.brain.set('sotws_max_id', id);

          // save sotw
          var existingSotWs = robot.brain.get('sotws') || [];
          sotw.id = id;
          existingSotWs.push(sotw);
          robot.brain.set('sotws', existingSotWs);
          msg.send('SotW "' + sotw.question + '" saved.');

          // clear sotw in progress
          delete sotwsInProgress[channel];
          robot.brain.set('sotws_in_progress', sotwsInProgress);
        }
        if (typeof sotw === 'undefined') {
          msg.send(noSotWInProgressMsg);
        }
      }
    }
  });

  robot.respond(/sotw list/i, function(msg) {
    var sotws = robot.brain.get('sotws') || [];
    var channel = msg.message.room;
    var id = 0;
    msg.send('Current sotws:');
    if (sotws.length === 0) {
      msg.send('No current sotws.');
    } else {
      var sotwsStr = '';
      sotws.forEach(function(sotw) {
        if (sotw.channel == channel) {
          id = id + 1;
          var sotwStr = sotw.id + '. ' + sotw.question;
          sotwsStr += sotwStr;
          sotwsStr += '\n';
        }
      });
      if (id > 0) {
        msg.send(sotwsStr);
        msg.send('To show options for a single sotw, say `sotw show [number]`.');
      } else {
        msg.send('No current sotws.');
      }
    }
  });

  robot.hear(/sotw show (\d+)/i, function(msg) {
    var sotwID = Number(msg.match[1]);
    var sotw = find(sotwID);

    if (typeof sotw === 'undefined') {
      msg.send('Sorry, I couldn\'t find that sotw.');
    } else {
      printSotW(sotw, msg, false);
    }
  });

  robot.hear(/sotw vote (\d+) ([A-Za-z])/i, function(msg) {
    if (isPrivateMsg(msg)) {
      var author = getUsername(msg);
      // find sotw by id number
      var sotwID = Number(msg.match[1]);
      var sotws = robot.brain.get('sotws');
      var sotw = sotws.filter(function(sotw) {
        return sotw.id === sotwID;
      })[0];

      if (typeof sotw === 'undefined') {
        msg.send('Sorry, I couldn\'t find that sotw.');
        return;
      }

      // check for duplicate votes
      var votes = robot.brain.get('sotw_user_votes') || {};
      var votedSotWs = votes[getUsername(msg)] || [];
      if (votedSotWs.indexOf(sotwID) !== -1) {
        msg.send('You\'ve already voted on this sotw.');
        return;
      }

      // find option by letter
      var optionLabel = msg.match[2];
      var optionIdx = optionLabel.charCodeAt() - 97;

      if (typeof sotw.options[optionIdx] === 'undefined') {
        msg.send('Sorry, I couldn\'t find that option for sotw ' + sotwID + '.');
        return;
      }

      if (sotw.options[optionIdx].author == author) {
        msg.send('You may not vote for your own submission, ' + author);
      } else {
        // increment option score and save
        sotw.options[optionIdx].score += 1;
        robot.brain.set('sotws', sotws);

        // add this sotw to the list of sotws this user has voted on
        votedSotWs.push(sotwID);
        votes[getUsername(msg)] = votedSotWs;
        robot.brain.set('sotw_user_votes', votes);

        msg.send('You voted for ' + sotw.options[optionIdx].name + ' on sotw "' + sotw.question + '"');
      }
    }
  });

  robot.respond(/sotw results (\d+)/i, function(msg) {
    var sotwID = Number(msg.match[1]);
    var sotw = find(sotwID);

    if (typeof sotw === 'undefined') {
      msg.send('Sorry, I couldn\'t find that sotw.');
    } else {
      msg.send('Results for:');
      printSotW(sotw, msg, true);

      // list voters
      var votes = robot.brain.get('sotw_user_votes') || {};
      var voters = [];
      for (let user of Object.keys(votes)) {
        if (votes[user].indexOf(sotwID) !== -1) {
          voters.push(user);
        }
      }
      msg.send('Already voted: ' + voters.join(' | ') );
    }
  });

//  robot.hear(/sotw random/i, function(msg) {
//    if (isPrivateMsg(msg)) {
//      var sotws = robot.brain.get('sotws');
//      var sotwIdx = Math.floor(Math.random() * sotws.length);
//      var sotw = sotws[sotwIdx];
//
//      printSotW(sotw, msg, false);
//    }
//  });

  // "private" function for bot owner to reset data
  robot.hear(/sotw flushall/, function(msg) {
    if (isPrivateMsg(msg)) {
      robot.brain.set('sotws', []);
      robot.brain.set('sotws_in_progress', []);
      robot.brain.set('sotws_max_id', 0);
      msg.send('SotW data flushed.');
    }
  });
};
