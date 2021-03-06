import React, { Component } from 'react'
import { ApolloProvider, Query, Mutation } from 'react-apollo'
import client from './client'
import { SERCHA_REPOSITORIES, ADD_STAR, REMOVE_STAR } from './graphql'

const StarButton = props => {
  const { node, query, first, last, before, after } = props
  const totalCount = node.stargazers.totalCount
  const starCount = totalCount === 1 ? '1 star' : `${totalCount} stars`
  const viewerHasStarred = node.viewerHasStarred
  const StarStatus = ({addOrRemoveStar}) => {
    return (
      <button
        onClick={
          () => {
            addOrRemoveStar({
              variables: { input: {starrableId: node.id} },
              update: (store, { data: { addStar, removeStar } }) => {
                const { starrable } = addStar || removeStar
                const data = store.readQuery({
                  query: SERCHA_REPOSITORIES,
                  variables: { query, first, last, after, before }
                })
                const edges = data.search.edges
                const newEdges = edges.map(edge => {
                  if (edge.node.id === node.id) {
                    const totalCount = edge.node.stargazers.totalCount
                    const diff = starrable.viewerHasStarred ? 1 : -1
                    const newTotalCount = totalCount + diff
                    edge.node.stargazers.totalCount = newTotalCount
                  }
                  return edges
                })
                data.search.edges = newEdges
                store.writeQuery({ query: SERCHA_REPOSITORIES, data })
              }
            })
          }
        }>
        {starCount} | {viewerHasStarred ? 'starred' : '-'}
      </button>
    )
  }

  return (
    <Mutation
      mutation={viewerHasStarred ? REMOVE_STAR : ADD_STAR}
    >
      {
        addOrRemoveStar => <StarStatus addOrRemoveStar={addOrRemoveStar} />
      }
    </Mutation>
  )
}

const PER_PAGE = 5

const DEFAULT_STATE = {
  "first": PER_PAGE,
  "after": null,
  "last": null,
  "before": null,
  "query": ""
}

class App extends Component {
  constructor(props) {
    super(props)

    this.state = DEFAULT_STATE
    this.myRef = React.createRef()
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleSubmit(event) {
    event.preventDefault()

    this.setState({
      query: this.myRef.current.value
    })
  }

  goPrev(search) {
    this.setState({
      first: null,
      after: null,
      last: PER_PAGE,
      before: search.pageInfo.startCursor
    })
  }

  goNext(search) {
    this.setState({
      first: PER_PAGE,
      after: search.pageInfo.endCursor,
      last: null,
      before: null
    })
  }

  render() {
    const { query, first, last, before, after } = this.state
    return (
      <ApolloProvider client={client}>
        <form onSubmit={this.handleSubmit}>
          <input ref={this.myRef} />
          <input type="submit" value="Submit" />
        </form>
        <Query
          query={SERCHA_REPOSITORIES}
          variables={{ query, first, last, before, after }}
        >
          {
            ({ loading, error, data }) => {
              if (loading) return "Loading..."
              if (error) return `ERROR! ${error.message}`

              const search = data.search
              const repositoryCount = search.repositoryCount
              const repositoryUnit = repositoryCount === 1 ? 'Repository' : 'Repositories'
              const title = `GitHub Repositories Search Result: ${data.search.repositoryCount} ${repositoryUnit}`
              return (
                <>
                  <h2>{title}</h2>
                  <ul>
                    {
                      search.edges.map(edge => {
                        const node = edge.node
                        return (
                          <li key={node.id}>
                            <a href={node.url} target="_blank" rel="noopener noreferrer">{node.name}</a>
                            &nbsp;
                            <StarButton node={node} {...{ query, first, last, before, after }} />
                          </li>
                        )
                      })
                    }
                  </ul>

                  {
                    search.pageInfo.hasPreviousPage === true ?
                      <button onClick={this.goPrev.bind(this, search)}>
                        Prev
                      </button>
                      :
                      null
                  }
                  {
                    search.pageInfo.hasNextPage === true ?
                      <button onClick={this.goNext.bind(this, search)}>
                        Next
                      </button>
                      :
                      null
                  }
                </>
              )
            }
          }
        </Query>
      </ApolloProvider>
    )
  }
}

export default App
