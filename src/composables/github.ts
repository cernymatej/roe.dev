export function useGithub(repo: string) {
  const { data: response } = useFetch(`https://api.github.com/repos/${repo}`, {
    key: repo,
    lazy: true,
  })

  const stars = computed(
    () => response.value && response.value.stargazers_count
  )
  const language = computed(() => response.value && response.value.language)

  return { stars, language }
}