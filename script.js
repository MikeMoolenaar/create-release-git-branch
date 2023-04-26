import inquirer from 'inquirer';
import fs from 'fs';
import {execSync} from 'child_process';
import semver from 'semver';

const requiredGitBranch = 'main';
const packageJsonPath = 'package.json'; // Gets current version from here

function bumpVersion(currentVersion, bumpType) {
    return semver.inc(currentVersion, bumpType === 'hotfix' ? 'patch' : bumpType);
}

async function createBranch(version, bumpType) {
    const branchPrefix = bumpType === 'hotfix' ? 'hotfix' : 'release';
    const branchName = `${branchPrefix}/${version}`;

    const gitCommand = `git checkout -b ${branchName}`;

    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: `Executing command:\n\n${gitCommand}\n\nContinue?`,
            default: true
        }
    ]);
    if (confirm) {
        execSync(gitCommand);
    } else {
        console.log('Aborting...');
    }
}

async function main() {
    // Check that we're on the correct branch
    const gitBranch = execSync('git branch --show-current').toString().trim();
    if (gitBranch !== requiredGitBranch) {
        console.error(`Error: You must be on the ${requiredGitBranch} branch`);
        return;
    }

    // Read the current version from package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    if (!semver.valid(currentVersion)) {
        console.error(`Error: Invalid version in package.json: ${currentVersion}`);
        return;
    }

    // Prompt user for bump type
    const {bumpType} = await inquirer.prompt([
        {
            type: 'list',
            name: 'bumpType',
            message: 'Choose a version bump type:',
            choices: ['hotfix', 'minor', 'major']
        }
    ]);

    // Bump the version
    const newVersion = bumpVersion(currentVersion, bumpType);
    console.log(`Bumped version from ${currentVersion} to ${newVersion}`);

    // Create a new branch
    await createBranch(newVersion, bumpType);
}

// Execute the main function
main();
