# M6: FruitCrawler

## Summarize the process of writing the paper and preparing the poster, including any surprises you encountered.
We wrote our paper concurrently while developing our end-to-end system. At the beginning of this process, when we separated out our components of the system (crawler, indexer, querier, and extra components), we also tried to mirror this structure in our paper. When we ran into any challenges that affected a specific component (for example, communication issues between nodes or bugs in our MapReduce/crawling logic), we documented both the problem and our debugging approach as part of the corresponding section in the paper.

One surprise we encountered was how much the act of writing helped clarify our own understanding of the system. Articulating our design choices allowed us to be maore precise about why we structured things a certain way, and this occasionally led to improvements in our actual implementation. 

In terms of creating our poster, we read through our paper and then tried to highlight what we felt were the most important or prominent parts of our project. Another important thing that we did was really emphasize our performance in the poster itself. We created multiple graphs and tried to make them the focal point of our presentation. Additionally, we made sure to include clear representations of our system architecture and pipeline so that viewers can better understand how the different components interact.

## Roughly, how many hours did M6 take you to complete?

Hours: 25

## How many LoC did the distributed version of the project end up taking?

DLoC: 4,205 lines


## How does this number compare with your non-distributed version?
LoC: This is almost 2,700 more lines than what I originally predicted in M0.

## How different are these numbers for different members in the team and why?
Vivian - 5,000 LoC
David - 3,000 LoC
Patrick - 1,500 LoC
Angela - 2,000 LoC

We assumed that these numbers differed across team members because each of us approached the estimation from different perspectives based on our roles, experiences, and familiarity with the components of the system. 