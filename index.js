const core = require('@actions/core');
const github = require('@actions/github');

function validateTitlePrefix(title, prefix, caseSensitive) {
    if (!caseSensitive) {
        prefix = prefix.toLowerCase();
        title = prefix.toLowerCase();
    }
    return title.startsWith(prefix);
}

async function run() {
    try {
        const eventName = github.context.eventName;
        core.info(`Event name: ${eventName}`);
        const title = getTitle(github.context.payload);

        if (!title) {
            core.setFailed(`Invalid event: ${eventName}`);
            return;
        }

        core.info(`Pull Request title: "${title}"`);
        // Check if title pass regex
        const regex = RegExp(core.getInput('regex'));
        core.info(`Regex: ${regex}`);
        if (!regex.test(title)) {
            core.setFailed(`Pull Request title "${title}" failed to pass match regex - ${regex}`);
            return
        }

        // Check min length
        const minLen = parseInt(core.getInput('min_length'));
        if (title.length < minLen) {
            core.setFailed(`Pull Request title "${title}" is smaller than min length specified - ${minLen}`);
            return
        }

        // Check max length
        const maxLen = parseInt(core.getInput('max_length'));
        if (maxLen > 0 && title.length > maxLen) {
            core.setFailed(`Pull Request title "${title}" is greater than max length specified - ${maxLen}`);
            return
        }

        // Check if title starts with a prefix
        const prefixes = core.getInput('allowed_prefixes');
        const prefixCaseSensitive = (core.getInput('prefix_case_sensitive') === 'true');
        core.info(`Allowed Prefixes: ${prefixes}`);
        if (prefixes.length > 0 && !prefixes.split(',').some((el) => validateTitlePrefix(title, el, prefixCaseSensitive))) {
            core.setFailed(`Pull Request title "${title}" did not match any of the prefixes - ${prefixes}`);
            return
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

function getTitle(payload) {
    if (payload && payload.issue && payload.issue.title) {
        return payload.issue.title;
    }

    if (payload &&
        payload.pull_request &&
        payload.pull_request.title)
    {
        return payload.pull_request.title;
    }
}

run();
