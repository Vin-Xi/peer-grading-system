console.log("hello");


db.collection('enrollcourses', function(err, collection) {

    const query = { StudentName: "check2", enroll: false };
    return itemsCollection.find(query)
      .sort({ name: 1 })
      .toArray()
      .then(items => {
        console.log(`Successfully found ${items.length} documents.`)
        items.forEach(console.log)
        return items
      })
      .catch(err => console.error(`Failed to find documents: ${err}`))
 })