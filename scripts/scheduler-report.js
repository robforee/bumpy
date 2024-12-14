import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { format } from 'date-fns';
import {  getTimezoneOffset } from 'date-fns-tz';

async function getSchedulerAndFunctionLogs(projectId, jobId, functionName, hoursBack = 5) {
    try {
        // Auth setup
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        // Initialize Google Cloud client
        const logging = google.logging({
            version: 'v2',
            projectId,
            auth
        });

        // Calculate time range
        const endTime = new Date();
        const startTime = new Date(endTime - (hoursBack * 60 * 60 * 1000));
        
        // Construct filter for both Cloud Scheduler and Function logs
        const filter = `
            resource.type="cloud_scheduler_job" AND
            resource.labels.project_id="${projectId}" AND
            resource.labels.job_id="${jobId}" AND
            timestamp >= "${startTime.toISOString()}"
            OR
            (
                resource.type="cloud_function" AND
                resource.labels.project_id="${projectId}" AND
                resource.labels.function_name="${functionName}" AND
                timestamp >= "${startTime.toISOString()}"
            )
        `;

        // Fetch logs
        console.log(filter)
        const response = await logging.entries.list({
            resourceNames: [`projects/${projectId}`],
            filter,
            orderBy: 'timestamp asc'
        });

        return response?.data?.entries || [];
    } catch (error) {
        throw new Error(`Failed to fetch logs: ${error.message}`);
    }
}

function formatLogEntry(entry) {
    const {
        timestamp,
        severity,
        resource,
        jsonPayload,
        textPayload,
        protoPayload
    } = entry;

    // Convert to Central Time by adjusting for timezone offset
    const date = new Date(timestamp);
    const timeZone = 'America/Chicago';
    let offset = getTimezoneOffset(timeZone, date);
    offset = 0; // no need to convert tz for this :P

    const localTime = new Date(date.getTime() - offset);
    const timeStr = format(localTime, 'HH:mm:ss');
    
    const source = resource.type;

    // Get appropriate message based on log source
    let message = '';
    let debugInfo = '';

    if (source === 'cloud_scheduler_job') {
        // Extract the type from jsonPayload['@type']
        const payloadType = jsonPayload?.['@type'] || '';
        message = payloadType.split('.').pop() || 'OK';  // This will get 'AttemptFinished'
        debugInfo = jsonPayload?.debugInfo || '';
    } else if (source === 'cloud_function') {
        message = textPayload || protoPayload?.status?.message || 'OK';
    }
    const payloadType2 = jsonPayload?.['@type'] || '';
    const message2 = payloadType2.split('.').pop() || '~~';  // This will get 'AttemptFinished'

    console.log('~~',resource.labels.job_id,timeStr,message2,jsonPayload?.status || 'OK','~~')

    // Format based on severity
    if (severity === 'ERROR') {
        return [
            `ERROR AT ${timeStr}`,
            `SOURCE: ${source}`,
            `MESSAGE: ${message}`,
            debugInfo ? `DEBUG: ${debugInfo}` : '',
            '---'
        ].filter(line => line).join('\n');
    }

    // Success case - single line
    return `${timeStr} | ${source.padEnd(15)} | OK | ${message}`;
}

async function generateExecutionReport(projectId, jobId, functionName, hoursBack = 5) {
    try {
        console.log(`\nExecution Report (Last ${hoursBack} hours)`);
        console.log('='.repeat(50));

        const entries = await getSchedulerAndFunctionLogs(
            projectId,
            jobId,
            functionName,
            hoursBack
        );

        if (!entries.length) {
            console.log('No executions found in the specified time range');
            return;
        }

        // Sort entries by timestamp
        entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Format and print each entry
        entries.forEach(entry => {
            console.log(formatLogEntry(entry));
        });

    } catch (error) {
        console.error(`Failed to generate execution report: ${error.message}`);
    }
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const usage = `
Usage: node scheduler-report.js [options]

Options:
    --project-id=<id>      Google Cloud project ID
    --job-id=<id>         Cloud Scheduler job ID
    --function-name=<name>  Cloud Function name
    --hours-back=<hours>     Hours to look back (default: 5)
    
Example:
    node scheduler-report.js --project-id=my-project --job-id=myJob --function-name=myFunction --hours-back=24
    `;

    if(args.length == 0 ){
        //console.log(usage);
        args.push('--project-id=analyst-server')
        args.push('--job-id=checkWork')
        args.push('--function-name=scheduledHelloWorld')
        args.push('--hours-back=2')

    }
    if (args.includes('--help')) {
        console.log(usage);
        process.exit(0);
    }

    const options = {
        projectId: '',
        jobId: '',
        functionName: '',
        hoursBack: 5
    };

    args.forEach(arg => {
        const [key, value] = arg.split('=');
        
        switch (key) {
            case '--project-id':
                options.projectId = value;
                break;
            case '--job-id':
                options.jobId = value;
                break;
            case '--function-name':
                options.functionName = value;
                break;
            case '--hours-back':
                options.hoursBack = parseInt(value, 10);
                break;
            default:
                console.error(`Unknown option: ${key}`);
                console.log(usage);
                process.exit(1);
        }
    });

    // Validate required options
    if (!options.projectId || !options.jobId || !options.functionName) {
        console.error('Missing required options');
        console.log(usage);
        process.exit(1);
    }

    return options;
}

// Main execution
async function main() {
    try {
        const options = parseArgs();
        
        await generateExecutionReport(
            options.projectId,
            options.jobId,
            options.functionName,
            options.hoursBack
        );
    } catch (error) {
        console.error('Error:', error.message);
        console.log('? gcloud auth login')
        console.log('? gcloud auth application-default login')
        process.exit(1);
    }
}

main();
