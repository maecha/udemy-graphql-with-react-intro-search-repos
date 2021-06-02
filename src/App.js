import React, { Component } from 'react'
import { ApolloProvider } from 'react-apollo'
import { Query } from 'react-apollo'
import client from './client'
import { ME } from './graphql'

class App extends Component {
  render() {
    return (
      <ApolloProvider client={client}>
        <Query query={ME}>
          {
            ({ loading, error, data }) => {
              if (loading) return "Loading..."
              if (error) return `ERROR! ${error.message}`

              return <div>{data.user.name}</div>
            }
          }
        </Query>
      </ApolloProvider>
    )
  }
}

export default App
