import { imageMeta } from 'image-meta'

const upcomingConferences: Array<{
  name: string
  dates: string
  link: string
  image?: {
    url: string
    width: number
    height: number
  }
  location: string
}> = [
  {
    name: 'DevFest Scotland',
    dates: '30 November',
    link: 'https://gdg.community.dev/events/details/google-gdg-glasgow-presents-devfest-scotland-2024-1/cohost-gdg-glasgow',
    location: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  },
  {
    name: 'DundeeScript Meetup',
    dates: '10 December',
    link: 'https://www.eventbrite.co.uk/e/dundeescript-meetup-tickets-1038765113417',
    location: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    image: {
      url: 'https://www.dundeescript.co.uk/images/dundeescript-logo.png',
      width: 684,
      height: 466,
    },
  },
]

export default defineCachedEventHandler(async () => {
  if (!import.meta.dev && !import.meta.prerender) return []

  return Promise.all(
    upcomingConferences.map(async conference => {
      if (conference.image) {
        return conference as Omit<typeof conference, 'image'> & { image: NonNullable<typeof conference.image> }
      }
      const html = await $fetch<string>(conference.link)
      const ogImage = html.match(
        /<meta[^>]*property="og:image"[^>]*content="([^"]+)"|<meta[^>]*content="([^"]+)"[^>]*property="og:image"/,
      )?.[1]

      if (!ogImage) {
        return {
          ...conference,
          image: {
            url: null,
            width: null,
            height: null,
          },
        }
      }

      // if (import.meta.dev) {
      //   return {
      //     ...conference,
      //     image: {
      //       url: ogImage,
      //       width: 1200,
      //       height: 630,
      //     },
      //   }
      // }

      const res = await $fetch(ogImage!, { responseType: 'arrayBuffer' }) as ArrayBuffer
      const metadata = imageMeta(new Uint8Array(res))

      return {
        ...conference,
        image: {
          url: ogImage,
          width: metadata.width,
          height: metadata.height,
        },
      }
    }),
  )
})
