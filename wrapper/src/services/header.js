const axios = require('axios')

module.exports.getHeader = () => {
  return axios
    .post('http://0.0.0.0:3001/batch-data', {
      header: {
        name: 'Header',
        data: {
          title: 'Micro Frontends',
          links: [
            {
              url: '/',
              text: 'Home',
            },
            {
              url: '#',
              text: 'Profile',
            },
            {
              url: '#',
              text: 'Contact Us',
            },
          ],
        },
      },
    })
    .then(({data}) => {
      return data.results
    })
}
