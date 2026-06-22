import { supplierQueries } from '../dist/models/queries.js';

async function run() {
    try {
        const s = await supplierQueries.create({
            name: 'Test Supplier',
            mobile: '9999999999',
            outstanding: 0
        });
        console.log('Created', s);
    } catch (err) {
        console.error('ERR', err);
    }
}

run();
