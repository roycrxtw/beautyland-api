# Beatuyland API

This is the data service of Beautyland Project. This api provides post data fetched from PTT beauty board.

## Usage
You can simply send a get request to api root path to fetch the latest posts in PTT Beauty board. The post data will be formatted in JSON.
```
http://royvbtw.uk:3004/
```
Or you can get the most popular posts in 1 to 7 days by send this get request:
```
http://royvbtw.uk:3004/trends/1
// or
http://royvbtw.uk:3004/trends/7
```

## JSON data format
```json
{
    link,
    author,
    postDate,
    title,
    postId,
    imgUrls, // an image link array
    clickCount,
    createdAt
}
```

## Test
The database-service test uses a local mongodb rather than a remote mongodb to speed up test. You must have a local mongodb installed on your computer if you want to run the test.

To run the test:
```
npm test
```
The test db url setting is:
```
// beautyland-api/config/db.config
mongodb://localhost:27017/beautyland-testingdb
```
You can change it according to your environment.


## License
Beautyland API is licensed under the MIT license.