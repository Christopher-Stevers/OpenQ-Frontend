import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import {
  GET_USER_BY_ID,
  GET_USER_BY_NAME,
  GET_ORG_BY_ID,
  GET_ORG_BY_NAME,
  GET_REPO_BY_NAME,
  GET_ISSUE,
  GET_ISSUE_BY_ID,
  GET_ISSUES_BY_ID,
  GET_ORGS_BY_ISSUES,
  GET_ORGS_BY_IDS,
  GET_PRS_BY_ISSUES,
  GET_PR_BY_ID,
  GET_USER_BY_URL,
  GET_USERS_BY_IDS,
  GET_ORGS_OR_USERS_BY_IDS,
  GET_LEAN_ISSUES_BY_ID,
  GET_PRS,
} from './graphql/query';
import fetch from 'cross-fetch';
import { setContext } from '@apollo/client/link/context';

class GithubRepository {
  constructor() {}

  httpLink = new HttpLink({
    uri: 'https://api.github.com/graphql',
    fetch,
  });

  client = new ApolloClient({
    uri: 'https://api.github.com/graphql',
    link: this.httpLink,
    cache: new InMemoryCache(),
  });

  // If setGraphqlHeaders is called on the CLIENT, it will use process.env.NEXT_PUBLIC_PATS, which is only available in the browser per next.config.js
  // If setGraphqlHeaders is called on the SERVER, it will use process.env.PATS, which is only available on the server per next.config.js
  patsArray = process.env.NEXT_PUBLIC_PATS ? process.env.NEXT_PUBLIC_PATS.split(',') : process.env.PATS.split(',');

  setGraphqlHeaders = (oauthToken) => {
    let authLink;

    // oauthToken will be null if the user does not have the github_oauth_token_unsigned cookie set
    // In this case, we initialize the Apollo Client for that page using the PAT, otherwise, we use the oauthToken
    if (oauthToken == null) {
      const token = this.patsArray[Math.floor(Math.random() * this.patsArray.length)];
      authLink = setContext((_, { headers }) => {
        return {
          headers: {
            ...headers,
            Authorization: `Bearer ${token}`,
          },
        };
      });
    } else {
      authLink = setContext((_, { headers }) => {
        return {
          headers: {
            ...headers,
            Authorization: `Bearer ${oauthToken}`,
          },
        };
      });
    }
    this.client.setLink(authLink.concat(this.httpLink));
  };

  async fetchIssueByUrl(issueUrl) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_ISSUE,
          variables: {
            issueUrl,
          },
        });
        resolve(result.data.resource);
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }

  async getPrs(owner, name, limit) {
    const variables = { owner, name, first: 100 };
    if (limit) {
      variables.first = limit;
    }

    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_PRS,
          variables,
        });
        const pullRequestObj = result.data.repository.pullRequests;
        resolve({ repoPrs: pullRequestObj.nodes, totalCount: pullRequestObj.totalCount });
      } catch (err) {
        reject(err);
      }
    });
  }

  parseIssueData(rawIssueResponse, reject) {
    try {
      const responseData = rawIssueResponse.data.node;
      const timelineItems = responseData.timelineItems.nodes;
      const prs = timelineItems.filter((event) => event?.source?.__typename === 'PullRequest');
      const closedEvents = timelineItems.filter((event) => event?.__typename === 'ClosedEvent');
      const closedAt = responseData.closedAt;
      const { title, body, url, createdAt, closed, id, bodyHTML, titleHTML } = responseData;
      const repoName = responseData.repository.name;
      const repoId = responseData.repository.id;
      const avatarUrl = responseData.repository.owner.avatarUrl;
      const owner = responseData.repository.owner.login;
      const twitterUsername = responseData.repository.owner.twitterUsername || null;
      const labels = responseData.labels.edges.map((edge) => edge.node);
      const number = responseData.number;
      const assignees = responseData.assignees.nodes;
      return {
        id,
        title,
        assignees,
        body,
        url,
        repoName,
        closedAt,
        owner,
        avatarUrl,
        labels,
        createdAt,
        closed,
        bodyHTML,
        titleHTML,
        twitterUsername,
        number,
        prs,
        repoId,
        closedEvents,
      };
    } catch (err) {
      reject(err);
      let id,
        title,
        assignees,
        repoId,
        body,
        url,
        repoName,
        closedAt,
        owner,
        avatarUrl,
        labels,
        createdAt,
        closed,
        bodyHTML,
        titleHTML,
        twitterUsername,
        number,
        prs,
        closedEvents;
      return {
        id,
        title,
        assignees,
        body,
        url,
        repoName,
        repoId,
        owner,
        avatarUrl,
        labels,
        createdAt,
        closedAt,
        closed,
        bodyHTML,
        titleHTML,
        twitterUsername,
        number,
        prs,
        closedEvents,
      };
    }
  }

  parseIssuesData(rawIssuesResponse, reject) {
    const responseData = rawIssuesResponse.data.nodes;
    return responseData
      .filter((event) => event?.__typename === 'Issue')
      .map((elem) => {
        try {
          const { title, body, url, createdAt, closed, id, bodyHTML, titleHTML } = elem;
          const repoName = elem.repository.name;
          const prs = elem.timelineItems.edges.map((edge) => edge.node);
          const avatarUrl = elem.repository.owner.avatarUrl;
          const owner = elem.repository.owner.login;
          const repoDescription = elem.repository.description;
          const repoId = elem.repository.id;
          const repoUrl = elem.repository.url;
          const assignees = elem.assignees.nodes;
          const number = elem.number;
          const labels = elem.labels.edges.map((edge) => edge.node);
          const languages = elem.repository.languages.edges.map((languages) => languages.node);
          return {
            id,
            title,
            body,
            url,
            languages,
            repoName,
            owner,
            avatarUrl,
            labels,
            createdAt,
            closed,
            bodyHTML,
            titleHTML,
            assignees,
            number,
            repoUrl,
            repoDescription,
            prs,
            repoId,
          };
        } catch (err) {
          reject(err);
          let id, url, repoName, owner, avatarUrl, labels, createdAt, closed, titleHTML, assignees;
          return {
            id,
            assignees,
            url,
            repoName,
            owner,
            avatarUrl,
            labels,
            createdAt,
            closed,
            titleHTML,
            bodyHTML: '',
          };
        }
      });
  }

  async fetchIssueById(issueId) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_ISSUE_BY_ID,
          variables: {
            issueId,
          },
        });
        resolve(this.parseIssueData(result, reject));
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }

  async getIssueData(issueIds) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_ISSUES_BY_ID,
          variables: {
            issueIds,
          },
          errorPolicy: 'all',
        });
        resolve(this.parseIssuesData(result, reject));
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }
  async getLeanIssueData(issueIds) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_LEAN_ISSUES_BY_ID,
          variables: {
            issueIds,
          },
          errorPolicy: 'all',
        });
        resolve(result.data.nodes);
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }
  async fetchOrgsWithIssues(issueIds) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_ORGS_BY_ISSUES,
          variables: {
            issueIds,
          },
        });
        resolve(result.data.nodes);
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }
  async searchOrgOrUser(ids) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_ORGS_OR_USERS_BY_IDS,
          variables: {
            ids,
          },
        });
        resolve(result.data.nodes);
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }
  async fetchOrgOrUserByLogin(login) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const organizationResult = await this.fetchOrganizationByLogin(login);
        resolve(organizationResult);
      } catch (e) {
        try {
          const userResult = await this.fetchUserByLogin(login);
          resolve(userResult);
        } catch (e) {
          reject(e);
        }
      }
    });

    return promise;
  }

  async fetchOrganizationByLogin(login) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_ORG_BY_NAME,
          variables: {
            login,
          },
        });
        resolve(result.data.organization);
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }

  async fetchUserByLogin(login) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_USER_BY_NAME,
          variables: {
            login,
          },
        });
        resolve(result.data.user);
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }

  async fetchRepoByName(owner, name) {
    const variables = { owner, name };
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_REPO_BY_NAME,
          variables,
        });
        resolve(result.data.repository);
      } catch (e) {
        console.log(e);
        reject(e);
      }
    });

    return promise;
  }

  async fetchOrgOrUserById(id) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const organizationResult = await this.fetchOrganizationById(id);
        if (organizationResult.__typename == 'Organization') {
          resolve(organizationResult);
        } else {
          const userResult = await this.fetchUserById(id);
          resolve(userResult);
        }
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }

  async fetchUserById(userId) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_USER_BY_ID,
          variables: {
            userId,
          },
        });
        const languages = result.data.node.repositories.nodes.map((repo) =>
          repo.languages.nodes.map((language) => language.name)
        );
        const getRecentLanguages = (languages) => {
          const recentLanguages = [];
          // for loop from the end of the array
          for (let i = languages.length - 1; i >= 0; i--) {
            // if the language is not in the array, add it
            if (!recentLanguages.includes(languages[i])) {
              recentLanguages.push(languages[i]);
            }
            // if the array is 5 languages long, break
            if (recentLanguages.length == 5) {
              break;
            }
          }
          return recentLanguages;
        };
        const recentLanguages = getRecentLanguages(languages.flat());
        let user = {};
        Object.assign(user, result.data.node, { recentLanguages: recentLanguages });
        resolve(user);
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }

  async fetchUsersByIds(userIds) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_USERS_BY_IDS,
          variables: {
            userIds,
          },
        });
        resolve(result.data.nodes);
      } catch (e) {
        reject(e);
      }
    });
    return promise;
  }

  async fetchPRsByIssues(bountyIds) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_PRS_BY_ISSUES,
          variables: {
            bountyIds,
          },
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
    return promise;
  }

  async getPrById(id) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_PR_BY_ID,
          variables: {
            id,
          },
        });
        resolve(result.data.node);
      } catch (e) {
        reject(e);
      }
    });
    return promise;
  }

  fetchUserByUrl(url) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_USER_BY_URL,
          variables: {
            url,
          },
        });
        resolve(result.data.resource.id);
      } catch (e) {
        reject(e);
      }
    });
    return promise;
  }

  async fetchOrganizationById(orgId) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_ORG_BY_ID,
          variables: {
            orgId,
          },
        });
        resolve(result.data.node);
      } catch (e) {
        reject(e);
      }
    });

    return promise;
  }

  async fetchOrganizationsByIds(orgIds) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.query({
          query: GET_ORGS_BY_IDS,
          variables: {
            orgIds,
          },
        });
        resolve(result.data.nodes);
      } catch (e) {
        reject(e);
      }
    });
    return promise;
  }

  async parseOrgIssues(issueIds) {
    const nodes = await this.fetchOrgsWithIssues(issueIds);
    const organizations = [];
    nodes.forEach((node) => {
      if (!organizations.some((organization) => organization.login === node.repository.owner.login)) {
        organizations.push(node.repository.owner);
      }
    });
    return organizations;
  }
}

export default GithubRepository;
