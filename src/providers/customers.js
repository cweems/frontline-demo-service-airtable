// Map between customer address and worker identity
// Used to determine to which worker route a new conversation with a particular customer
//
// {
//     customerAddress: workerIdentity
// }
//
// Example:
//     {
//         'whatsapp:+12345678': 'john@example.com'
//     }

const config = require('../config');
const customersToWorkersMap = {};

// Create global variable to memoize customer data
// so that we do not ping airtable for all customers every page load
let customers = [];

// Retrieve customers from Airtable
// Example:
const retrieveAirtableData = async () => {
    var Airtable = require('airtable');
    var base = new Airtable({apiKey: config.twilio.airtable_api_key}).base(config.twilio.airtable_base_id);

    return new Promise((resolve, reject) => {
        let formattedCustomers = [];
    
        base(config.twilio.airtable_table_name).select({
            view: "Grid view",
            pageSize: 100
        }).eachPage(function page(records, fetchNextPage) {
            // This function (`page`) will get called for each page of records.
        
            records.forEach(function(record) {
                let formattedRecord = {
                    customer_id: record.get('id'),
                    display_name: record.get('name'),
                    channels: [
                        { type: 'sms', value: record.get('sms') },
                        { type: 'whatsapp', value: record.get('whatsapp') }
                    ],
                    links: [
                        { type: 'LinkedIn', value: record.get('linkedin'), display_name: 'Social Media Profile' }
                    ],
                    details:{
                        title: "Information",
                        content: record.get('notes')
                    },
                    worker: record.get('owner')
                }
                formattedCustomers.push(formattedRecord);
            });
        
            // To fetch the next page of records, call `fetchNextPage`.
            // If there are more records, `page` will get called again.
            // If there are no more records, `done` will get called.
            console.log('fetching next page...')
            fetchNextPage();
        
        }, function done(err) {
            if (err) { reject(err) }
            resolve(formattedCustomers);
        });
    });

}

const findWorkerForCustomer = async (customerNumber) => customersToWorkersMap[customerNumber];

const findRandomWorker = async () => {
    const onlyUnique = (value, index, self) => {
        return self.indexOf(value) === index;
    }

    const workers = Object.values(customersToWorkersMap).filter(onlyUnique)
    const randomIndex = Math.floor(Math.random() * workers.length)

    return workers[randomIndex]
}

const getCustomersList = async (worker, pageSize, anchor) => {
    console.log(pageSize, anchor);

    // Pull airtable customers on first load, otherwise use
    // what's stored in memory
    if(anchor === undefined || customers.length === 0) {
        customers = await retrieveAirtableData();
    }
    const workerCustomers = customers.filter(customer => customer.worker === worker);
    const list = workerCustomers.map(customer => ({
        display_name: customer.display_name,
        customer_id: customer.customer_id,
        avatar: customer.avatar,
    }));

    if (!pageSize) {
        return list
    }

    if (anchor) {
        const lastIndex = list.findIndex((c) => String(c.customer_id) === String(anchor))
        const nextIndex = lastIndex + 1
        return list.slice(nextIndex, nextIndex + pageSize)
    } else {
        return list.slice(0, pageSize)
    }
};

const getCustomerByNumber = async (customerNumber) => {
    if (customers.length === 0) {
        customers = await retrieveAirtableData();
    }
    return customers.find(customer => customer.channels.find(channel => String(channel.value) === String(customerNumber)));
};

const getCustomerById = async (customerId) => {
    if (customers.length === 0) {
        customers = await retrieveAirtableData();
    }
    return customers.find(customer => String(customer.customer_id) === String(customerId));
};

module.exports = {
    customersToWorkersMap,
    findWorkerForCustomer,
    findRandomWorker,
    getCustomerById,
    getCustomersList,
    getCustomerByNumber
};
