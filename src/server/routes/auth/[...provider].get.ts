/* eslint-disable camelcase */

import { query } from '../../utils/github'
import { loginUser } from '../../utils/auth'
import { getSponsors } from '../../utils/sponsors'

export default defineEventHandler(async event => {
  const { code } = getQuery(event)

  if (!code) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Missing authorisation code.',
    })
  }

  const config = useRuntimeConfig()
  const { access_token } = await $fetch<{ access_token: string }>(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      body: {
        client_id: config.public.githubClientId,
        client_secret: config.github.clientSecret,
        code,
      },
    }
  ).catch(err => {
    console.error('access', err)
    return {} as { access_token?: string }
  })

  if (access_token) {
    // Determine if user is a sponsor
    const [viewer, ids] = await Promise.all([
      query(access_token, organisationQuery)
        .then(r => {
          const viewer = r.data?.viewer || {}
          viewer.orgs = viewer.organizations.edges.map(e => e.node.id) || []
          return viewer
        })
        .catch(err => {
          console.error('viewer', err)
          return {}
        }),
      getSponsors()
        .then(r => r.map(s => s.id))
        .catch(err => {
          console.error('sponsor', err)
          return []
        }),
    ])

    console.info({
      sponsor:
        ids.includes(viewer.id) || ids.some(i => viewer.orgs.includes(i)),
      avatar: viewer.avatarUrl,
      name: viewer.name,
    })

    // set custom JWT claim
    await loginUser(event, {
      sponsor:
        ids.includes(viewer.id) || ids.some(i => viewer.orgs.includes(i)),
      avatar: viewer.avatarUrl,
      name: viewer.name,
    })
  }

  return sendRedirect(event, '/')
})

const organisationQuery = `{
  viewer {
    id
    name
    avatarUrl
    organizations(first: 100) {
      edges {
        node {
          id
        }
      }
    }
  }
}`
