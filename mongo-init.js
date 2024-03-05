console.log('Creating replica set...');
var config = {
  '_id': 'vending-machine-rs',
  'version': 1,
  'members': [
    {
      '_id': 1,
      'host': 'mongodb:27017'
    }
  ]
};
rs.initiate(config, { force: true });
rs.status();
