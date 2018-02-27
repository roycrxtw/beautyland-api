# Beatuyland API

This is the data service of Beautyland Project. This API provides the post data fetched from [PTT Beauty](https://www.ptt.cc/bbs/Beauty) board.

## Usage

You can simply send a GET request to API root path to fetch the latest posts of PTT Beauty board. The post data will be formatted in JSON.
```
https://beautyland-api.royxnatw.uk/
```
Or you can get the most popular posts in a week by send this get request:
```
https://beautyland-api.royxnatw.uk/trends
```

You can also use /samples end point for a random post results:
```
https://beautyland-api.royxnatw.uk/samples
```

### Get the post

You can fetch a single post data with this end point:

```
https://beautyland-api.royxnatw.uk/posts/[the-post-id]
```

## The data format

The returned data will be formatted in JSON.
```
{
  link,
  author,
  title,
  postId,
  images, // array data. It contains image url, width and height data.
  viewCount,
  createdAt
}
```

## Test

The database-service test uses a local mongodb rather than a remote mongodb to speed up test. You must have a local mongodb installed on your machine if you want to run the test.

To run the test with jest and eslint:

```
npm test
```

To run the jest test only:

```
npm run testonly
```

The test db url setting is:

```
// beautyland-api/config/main.config
testDbUrl: 'mongodb://localhost:27017/beautyland-testingdb'
```

You can change it according to your environment.

## License

Beautyland API is licensed under the MIT license.
