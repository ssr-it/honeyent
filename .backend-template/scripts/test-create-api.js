import { customerQueries, orderQueries, tripQueries, productQueries } from './test-helpers.js';

async function run() {
    try {
        console.log('Testing product create...');
        const p = await productQueries.create({
            name: 'Test Aggregate',
            hsn: '25051019',
            unit: 'MT',
            gstRate: 5,
            defaultRate: 555,
            category: 'Aggregate',
        });
        console.log('Product created:', p.id, p.code, p.name, p.hsn);

        console.log('Testing order create...');
        const c = (await customerQueries.getAll())[0];
        const prod = await productQueries.getById(p.id);
        const order = await orderQueries.create({
            date: '2026-06-12',
            customer: c.code,
            product: prod.code,
            qty: 10,
            rate: 550,
            vehicle: 'HR55AB1234',
            driver: 'Ramesh Yadav',
            freight: 200,
            paymentTerms: 'Net 15',
        });
        console.log('Order created:', order.id, order.no, order.customer, order.product, order.vehicle);

        console.log('Testing trip create...');
        const trip = await tripQueries.create({
            date: '2026-06-12',
            vehicle: 'HR55AB1234',
            driver: 'Ramesh Yadav',
            source: 'Quarry',
            destination: 'Site A',
            weight: 10,
            revenue: 8000,
            tripExpenses: 1500,
        });
        console.log('Trip created:', trip.id, trip.tripNo, trip.vehicle, trip.driver);

        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

run();