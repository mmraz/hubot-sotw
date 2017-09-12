hubot-sotw
==============

Create Song of the Week polls and vote on them by messaging hubot.
Initially based off of https://github.com/rorysaur/hubot-secret-ballot

API
---

*   hubot sotw create "<question>" - create new sotw in progress for the channel, ex. `sotw create "Song of the Week 2020-01-01 Theme: hubot"`
*   hubot sotw add option "<option>" - add an option to a sotw currently in progress, ex. `sotw add option "some option"`
*   hubot sotw update option <letter> "<new option>" - update option to a sotw currently in progress, ex. `sotw update option b "new option value"`
*   hubot sotw preview - preview a sotw currently in progress for the channel
*   hubot sotw done - finish and activate a sotw currently in progress, only the creator may take this action
*   hubot sotw vote <sotw number> <option letter> - vote on a sotw, ex. `sotw vote 1 a`, self votes are disallowed
*   hubot sotw list - (public or pm) lists all existing sotws
*   hubot sotw show <sotw number> - (public or pm) show details for a single sotw, ex. `hubot sotw show 1`
*   hubot sotw results <sotw number> - (public or pm) list results for a single sotw (public or private), ex. `hubot sotw results 1`
Uses hubot brain.

## Add it to your hubot

Add the following to your package.json

"hubot-sotw": "git+https://github.com/mmraz/hubot-sotw.git"

    $ npm install hubot-sotw --save

Then add `hubot-sotw` to the `external-scripts.json` file (you may need to create this file).

    ["hubot-sotw"]
