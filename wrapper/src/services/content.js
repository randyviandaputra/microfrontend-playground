const axios = require('axios')

module.exports.getContent = () => {
  return axios
    .post('http://0.0.0.0:3002/batch-data', {
      content: {
        name: 'ProductList',
        data: {
          title: 'Tech Stack',
          items: [
            {
              title: 'React.js',
              imageUrl: 'https://cdn.auth0.com/blog/react-js/react.png',
            },
            {
              title: 'Vue.js',
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Vue.png/220px-Vue.png',
            },
            {
              title: 'React.js',
              imageUrl: 'https://cdn.auth0.com/blog/react-js/react.png',
            },
          ],
        },
      },
    })
    .then(({data}) => {
      return data.results.content
    })
}
