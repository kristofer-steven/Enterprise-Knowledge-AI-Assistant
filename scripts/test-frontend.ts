const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

interface SmokeCheck {
    name: string;
    url: string;
    method?: string;
    body?: any;
    validate: (res: any, status: number) => boolean;
}

const checks: SmokeCheck[] = [
    {
        name: 'Frontend Home Shell (GET /)',
        url: `${FRONTEND_URL}/`,
        validate: (text, status) => status === 200 && typeof text === 'string' && text.includes('<!DOCTYPE html>')
    },
    {
        name: 'Frontend Health Gateway (GET /api/health)',
        url: `${FRONTEND_URL}/api/health`,
        validate: (data, status) => status === 200 && (data.status === 'healthy' || data.status === 'degraded')
    },
    {
        name: 'Frontend Document Catalog (GET /api/documents)',
        url: `${FRONTEND_URL}/api/documents`,
        validate: (data, status) => status === 200 && Array.isArray(data.documents) && data.documents.length > 0
    },
    {
        name: 'Chat Gateway Proxy (POST /api/chat)',
        url: `${FRONTEND_URL}/api/chat`,
        method: 'POST',
        body: { message: 'What is the maximum reimbursement for hotel in New York?' },
        validate: (data, status) =>
            status === 200 &&
            data.routed_to === 'policy-agent' &&
            data.response?.answer?.includes('250')
    }
];

async function runSmokeTest() {
    console.log('====================================================');
    console.log('  Frontend & Full-Stack Gateway Smoke Benchmark');
    console.log('====================================================\n');

    let passed = 0;

    for (let i = 0; i < checks.length; i++) {
        const c = checks[i];
        console.log(`[${i + 1}/${checks.length}] Testing: ${c.name}...`);

        try {
            const res = await fetch(c.url, {
                method: c.method || 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: c.body ? JSON.stringify(c.body) : undefined
            });

            const contentType = res.headers.get('content-type') || '';
            let payload: any;
            if (contentType.includes('application/json')) {
                payload = await res.json();
            } else {
                payload = await res.text();
            }

            const isOk = c.validate(payload, res.status);
            if (isOk) {
                passed++;
                console.log(` ✅ PASSED (${res.status} OK)\n`);
            } else {
                console.error(` ❌ FAILED Validation. Status: ${res.status}\n`);
            }
        } catch (err: any) {
            console.error(` ❌ EXCEPTION: ${err.message}\n`);
        }
    }

    console.log('====================================================');
    console.log(`Score: ${((passed / checks.length) * 100).toFixed(0)}% (${passed}/${checks.length} passed)`);
    console.log('====================================================');

    if (passed < checks.length) {
        process.exit(1);
    }
}

runSmokeTest().catch(console.error);
