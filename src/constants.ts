export const TECH_SUBREDDITS = ['experienceddevs', 'node', 'reactjs'];
export const BUSINESS_SUBREDDITS = [
  'entrepreneur',
  'startups',
  'saas',
  'sideproject',
];
export const SUBREDDITS = [...TECH_SUBREDDITS, ...BUSINESS_SUBREDDITS];

export enum HckrNewsPostFilter {
  Top10 = 10,
  Top20 = 20,
  Top50Percent = 0.5,
}

export type Post = {
  numberOfComments: number;
  numberOfUpvotes: number;
  title: string;
  url: string;
};
