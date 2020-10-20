/** Template processort */
  export default async function ({login, q}, {data, rest, graphql, plugins}, {s, pending, imports}) {

    //Init
      const computed = data.computed = {commits:0, sponsorships:0, licenses:{favorite:"", used:{}}, svg:{height:355, width:480}, token:{}, repositories:{watchers:0, stargazers:0, issues_open:0, issues_closed:0, pr_open:0, pr_merged:0, forks:0}, plugins:{}}
      const avatar = imports.imgb64(data.user.avatarUrl)

    //Plugins
      if (data.user.websiteUrl)
        imports.plugins.pagespeed({login, url:data.user.websiteUrl, computed, pending, q}, plugins.pagespeed)
      imports.plugins.lines({login, repositories:data.user.repositories.nodes.map(({name}) => name), rest, computed, pending, q}, plugins.lines)
      imports.plugins.traffic({login, repositories:data.user.repositories.nodes.map(({name}) => name), rest, computed, pending, q}, plugins.traffic)
      imports.plugins.habits({login, rest, computed, pending, q}, plugins.habits)
      imports.plugins.selfskip({login, rest, computed, pending, q}, plugins.selfskip)
      imports.plugins.languages({login, data, computed, pending, q}, plugins.languages)
      imports.plugins.followup({login, data, computed, pending, q}, plugins.followup)

    //Iterate through user's repositories
      for (const repository of data.user.repositories.nodes) {
        //Simple properties with totalCount
          for (const property of ["watchers", "stargazers", "issues_open", "issues_closed", "pr_open", "pr_merged"])
            computed.repositories[property] += repository[property].totalCount
        //Forks
          computed.repositories.forks += repository.forkCount
        //License
          if (repository.licenseInfo)
            computed.licenses.used[repository.licenseInfo.spdxId] = (computed.licenses.used[repository.licenseInfo.spdxId] || 0) + 1
      }

    //Compute licenses stats
      computed.licenses.favorite = Object.entries(computed.licenses.used).sort(([an, a], [bn, b]) => b - a).slice(0, 1).map(([name, value]) => name) || ""

    //Compute total commits and sponsorships
      computed.commits += data.user.contributionsCollection.totalCommitContributions + data.user.contributionsCollection.restrictedContributionsCount
      computed.sponsorships = data.user.sponsorshipsAsSponsor.totalCount + data.user.sponsorshipsAsMaintainer.totalCount

    //Compute registration date
      const diff = (Date.now()-(new Date(data.user.createdAt)).getTime())/(365*24*60*60*1000)
      const years = Math.floor(diff)
      const months = Math.ceil((diff-years)*12)
      computed.registration = years ? `${years} year${s(years)} ago` : `${months} month${s(months)} ago`

    //Compute calendar
      computed.calendar = data.user.calendar.contributionCalendar.weeks.flatMap(({contributionDays}) => contributionDays).slice(0, 14).reverse()

    //Avatar (base64)
      computed.avatar = await avatar || "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

    //Token scopes
      computed.token.scopes = (await rest.request("HEAD /")).headers["x-oauth-scopes"].split(", ")

  }