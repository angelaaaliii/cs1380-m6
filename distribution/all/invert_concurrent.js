
/**
 * Mapper part of the tf-idf inverted index calculations
 * We need the total number of documents as an additional argument
 * @param {*} key the docID, the URL of the page being processed
 * @param {string} value the content of the page being processed
 * @return a dictionary of {word1: [docID, wordFrequency, docWordCount, totalDocs], word2: [docID, wordFrequency, docWordCount, totalDocs], ...}
 */
function invertedIndexMapper(key, value, totalDocs, PorterStemmer, readFileSync, resolve) {
    out = {};

    function stemmer(w) {
        const step2list = {
          'ational': 'ate',
          'tional': 'tion',
          'enci': 'ence',
          'anci': 'ance',
          'izer': 'ize',
          'abli': 'able',
          'alli': 'al',
          'entli': 'ent',
          'eli': 'e',
          'ousli': 'ous',
          'ization': 'ize',
          'ation': 'ate',
          'ator': 'ate',
          'alism': 'al',
          'iveness': 'ive',
          'fulness': 'ful',
          'ousness': 'ous',
          'aliti': 'al',
          'iviti': 'ive',
          'biliti': 'ble'
        };
      
        const step3list = {
          'icate': 'ic',
          'ative': '',
          'alize': 'al',
          'iciti': 'ic',
          'ical': 'ic',
          'ful': '',
          'ness': ''
        };
      
        const c = '[^aeiou]';
        const v = '[aeiouy]';
        const C = c + '[^aeiouy]*';
        const V = v + '[aeiou]*';
      
        const mgr0 = '^(' + C + ')?' + V + C;              // [C]VC... is m>0
        const meq1 = '^(' + C + ')?' + V + C + '(' + V + ')?$'; // [C]VC[V] is m=1
        const mgr1 = '^(' + C + ')?' + V + C + V + C;       // [C]VCVC... is m>1
        const s_v = '^(' + C + ')?' + v;                   // vowel in stem
      
        let stem;
        let suffix;
        let re;
        let re2;
        let re3;
        let re4;
      
        if (w.length < 3) return w;
      
        const first = w[0];
        if (first === 'y') w = first.toUpperCase() + w.substr(1);
      
        // Step 1a
        re = /^(.+?)(ss|i)es$/;
        re2 = /^(.+?)([^s])s$/;
        if (re.test(w)) w = w.replace(re, '$1$2');
        else if (re2.test(w)) w = w.replace(re2, '$1$2');
      
        // Step 1b
        re = /^(.+?)eed$/;
        re2 = /^(.+?)(ed|ing)$/;
        if (re.test(w)) {
          const fp = re.exec(w);
          re3 = new RegExp(mgr0);
          if (re3.test(fp[1])) {
            re = /.$/;
            w = w.replace(re, '');
          }
        } else if (re2.test(w)) {
          const fp = re2.exec(w);
          stem = fp[1];
          re3 = new RegExp(s_v);
          if (re3.test(stem)) {
            w = stem;
            re = /(at|bl|iz)$/;
            re2 = new RegExp('([^aeiouylsz])\\1$');
            re3 = new RegExp('^' + C + v + '[^aeiouwxy]$');
            if (re.test(w)) w += 'e';
            else if (re2.test(w)) {
              re = /.$/;
              w = w.replace(re, '');
            } else if (re3.test(w)) w += 'e';
          }
        }
      
        // Step 1c
        re = /^(.+?)y$/;
        if (re.test(w)) {
          const fp = re.exec(w);
          stem = fp[1];
          re = new RegExp(s_v);
          if (re.test(stem)) w = stem + 'i';
        }
      
        // Step 2
        re = /^(.+?)(ational|tional|enci|anci|izer|abli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti)$/;
        if (re.test(w)) {
          const fp = re.exec(w);
          stem = fp[1];
          suffix = fp[2];
          re = new RegExp(mgr0);
          if (re.test(stem)) w = stem + step2list[suffix];
        }
      
        // Step 3
        re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
        if (re.test(w)) {
          const fp = re.exec(w);
          stem = fp[1];
          suffix = fp[2];
          re = new RegExp(mgr0);
          if (re.test(stem)) w = stem + step3list[suffix];
        }
      
        // Step 4
        re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
        re2 = /^(.+?)(s|t)(ion)$/;
        if (re.test(w)) {
          const fp = re.exec(w);
          stem = fp[1];
          re = new RegExp(mgr1);
          if (re.test(stem)) w = stem;
        } else if (re2.test(w)) {
          const fp = re2.exec(w);
          stem = fp[1] + fp[2];
          re2 = new RegExp(mgr1);
          if (re2.test(stem)) w = stem;
        }
      
        // Step 5a
        re = /^(.+?)e$/;
        if (re.test(w)) {
          const fp = re.exec(w);
          stem = fp[1];
          re = new RegExp(mgr1);
          re2 = new RegExp(meq1);
          re3 = new RegExp('^' + C + v + '[^aeiouwxy]$');
          if (re.test(stem) || (re2.test(stem) && !re3.test(stem))) {
            w = stem;
          }
        }
      
        // Step 5b
        re = /ll$/;
        re2 = new RegExp(mgr1);
        if (re.test(w) && re2.test(w)) {
          re = /.$/;
          w = w.replace(re, '');
        }
      
        if (first === 'y') w = first.toLowerCase() + w.substr(1);
        return w;
      }

    const stopwords = `
a
able
ableabout
about
above
abroad
abst
accordance
according
accordingly
across
act
actually
ad
added
adj
adopted
ae
af
affected
affecting
affects
after
afterwards
ag
again
against
ago
ah
ahead
ai
ain
aint
al
all
allow
allows
almost
alone
along
alongside
already
also
although
always
am
amid
amidst
among
amongst
amoungst
amount
an
and
announce
another
any
anybody
anyhow
anymore
anyone
anything
anyway
anyways
anywhere
ao
apart
apparently
appear
appreciate
appropriate
approximately
aq
ar
are
area
areas
aren
arent
arise
around
arpa
as
aside
ask
asked
asking
asks
associated
at
au
auth
available
aw
away
awfully
az
b
ba
back
backed
backing
backs
backward
backwards
bb
bd
be
became
because
become
becomes
becoming
been
before
beforehand
began
begin
beginning
beginnings
begins
behind
being
beings
believe
below
beside
besides
best
better
between
beyond
bf
bg
bh
bi
big
bill
billion
biol
bj
bm
bn
bo
both
bottom
br
brief
briefly
bs
bt
but
buy
bv
bw
by
bz
c
ca
call
came
can
cannot
cant
caption
case
cases
cause
causes
cc
cd
certain
certainly
cf
cg
ch
changes
ci
ck
cl
clear
clearly
click
cm
cmon
cn
co
com
come
comes
computer
con
concerning
consequently
consider
considering
contain
containing
contains
copy
corresponding
could
couldn
couldnt
course
cr
cry
cs
cu
currently
cv
cx
cy
cz
d
dare
daren
darent
date
de
dear
definitely
describe
described
despite
detail
did
didn
didnt
differ
different
differently
directly
dj
dk
dm
do
does
doesn
doesnt
doing
don
done
dont
doubtful
down
downed
downing
downs
downwards
due
during
dz
e
each
early
ec
ed
edu
ee
effect
eg
eh
eight
eighty
either
eleven
else
elsewhere
empty
end
ended
ending
ends
enough
entirely
er
es
especially
et
etc
even
evenly
ever
evermore
every
everybody
everyone
everything
everywhere
ex
exactly
example
except
f
face
faces
fact
facts
fairly
far
farther
felt
few
fewer
ff
fi
fifteen
fifth
fifty
fify
fill
find
finds
fire
first
five
fix
fj
fk
fm
fo
followed
following
follows
for
forever
former
formerly
forth
forty
forward
found
four
fr
free
from
front
full
fully
further
furthered
furthering
furthermore
furthers
fx
g
ga
gave
gb
gd
ge
general
generally
get
gets
getting
gf
gg
gh
gi
give
given
gives
giving
gl
gm
gmt
gn
go
goes
going
gone
good
goods
got
gotten
gov
gp
gq
gr
great
greater
greatest
greetings
group
grouped
grouping
groups
gs
gt
gu
gw
gy
h
had
hadn
hadnt
half
happens
hardly
has
hasn
hasnt
have
haven
havent
having
he
hed
hell
hello
help
hence
her
here
hereafter
hereby
herein
heres
hereupon
hers
herse
herself
hes
hi
hid
high
higher
highest
him
himse
himself
his
hither
hk
hm
hn
home
homepage
hopefully
how
howbeit
however
hr
ht
htm
html
http
hu
hundred
i
id
ie
if
ignored
ii
il
ill
im
immediate
immediately
importance
important
in
inasmuch
inc
indeed
index
indicate
indicated
indicates
information
inner
inside
insofar
instead
int
interest
interested
interesting
interests
into
invention
inward
io
iq
ir
is
isn
isnt
it
itd
itll
its
itse
itself
ive
j
je
jm
jo
join
jp
just
k
ke
keep
keeps
kept
keys
kg
kh
ki
kind
km
kn
knew
know
known
knows
kp
kr
kw
ky
kz
l
la
large
largely
last
lately
later
latest
latter
latterly
lb
lc
least
length
less
lest
let
lets
li
like
liked
likely
likewise
line
little
lk
ll
long
longer
longest
look
looking
looks
low
lower
lr
ls
lt
ltd
lu
lv
ly
m
ma
made
mainly
make
makes
making
man
many
may
maybe
mayn
maynt
mc
md
me
mean
means
meantime
meanwhile
member
members
men
merely
mg
mh
microsoft
might
mightn
mightnt
mil
mill
million
mine
minus
miss
mk
ml
mm
mn
mo
mon
more
moreover
most
mostly
move
mp
mq
mr
mrs
ms
msie
mt
mu
much
mug
must
mustn
mustnt
mv
mw
mx
my
myse
myself
mz
n
na
name
namely
nay
nc
nd
ne
near
nearly
necessarily
necessary
need
needed
needing
needn
neednt
needs
neither
net
netscape
never
neverf
neverless
nevertheless
new
newer
newest
next
nf
ng
ni
nine
ninety
nl
no
nobody
non
none
nonetheless
noone
nor
normally
nos
not
noted
nothing
notwithstanding
novel
now
nowhere
np
nr
nu
null
number
numbers
nz
o
obtain
obtained
obviously
of
off
often
oh
ok
okay
old
older
oldest
om
omitted
on
once
one
ones
only
onto
open
opened
opening
opens
opposite
or
ord
order
ordered
ordering
orders
org
other
others
otherwise
ought
oughtn
oughtnt
our
ours
ourselves
out
outside
over
overall
owing
own
p
pa
page
pages
part
parted
particular
particularly
parting
parts
past
pe
per
perhaps
pf
pg
ph
pk
pl
place
placed
places
please
plus
pm
pmid
pn
point
pointed
pointing
points
poorly
possible
possibly
potentially
pp
pr
predominantly
present
presented
presenting
presents
presumably
previously
primarily
probably
problem
problems
promptly
proud
provided
provides
pt
put
puts
pw
py
q
qa
que
quickly
quite
qv
r
ran
rather
rd
re
readily
really
reasonably
recent
recently
ref
refs
regarding
regardless
regards
related
relatively
research
reserved
respectively
resulted
resulting
results
right
ring
ro
room
rooms
round
ru
run
rw
s
sa
said
same
saw
say
saying
says
sb
sc
sd
se
sec
second
secondly
seconds
section
see
seeing
seem
seemed
seeming
seems
seen
sees
self
selves
sensible
sent
serious
seriously
seven
seventy
several
sg
sh
shall
shan
shant
she
shed
shell
shes
should
shouldn
shouldnt
show
showed
showing
shown
showns
shows
si
side
sides
significant
significantly
similar
similarly
since
sincere
site
six
sixty
sj
sk
sl
slightly
sm
small
smaller
smallest
sn
so
some
somebody
someday
somehow
someone
somethan
something
sometime
sometimes
somewhat
somewhere
soon
sorry
specifically
specified
specify
specifying
sr
st
state
states
still
stop
strongly
su
sub
substantially
successfully
such
sufficiently
suggest
sup
sure
sv
sy
system
sz
t
take
taken
taking
tc
td
tell
ten
tends
test
text
tf
tg
th
than
thank
thanks
thanx
that
thatll
thats
thatve
the
their
theirs
them
themselves
then
thence
there
thereafter
thereby
thered
therefore
therein
therell
thereof
therere
theres
thereto
thereupon
thereve
these
they
theyd
theyll
theyre
theyve
thick
thin
thing
things
think
thinks
third
thirty
this
thorough
thoroughly
those
thou
though
thoughh
thought
thoughts
thousand
three
throug
through
throughout
thru
thus
til
till
tip
tis
tj
tk
tm
tn
to
today
together
too
took
top
toward
towards
tp
tr
tried
tries
trillion
truly
try
trying
ts
tt
turn
turned
turning
turns
tv
tw
twas
twelve
twenty
twice
two
tz
u
ua
ug
uk
um
un
under
underneath
undoing
unfortunately
unless
unlike
unlikely
until
unto
up
upon
ups
upwards
us
use
used
useful
usefully
usefulness
uses
using
usually
uucp
uy
uz
v
va
value
various
vc
ve
versus
very
vg
vi
via
viz
vn
vol
vols
vs
vu
w
want
wanted
wanting
wants
was
wasn
wasnt
way
ways
we
web
webpage
website
wed
welcome
well
wells
went
were
weren
werent
weve
wf
what
whatever
whatll
whats
whatve
when
whence
whenever
where
whereafter
whereas
whereby
wherein
wheres
whereupon
wherever
whether
which
whichever
while
whilst
whim
whither
who
whod
whoever
whole
wholl
whom
whomever
whos
whose
why
widely
width
will
willing
wish
with
within
without
won
wonder
wont
words
work
worked
working
works
world
would
wouldn
wouldnt
ws
www
x
y
ye
year
years
yes
yet
you
youd
youll
young
younger
youngest
your
youre
yours
yourself
yourselves
youve
yt
yu
z
za
zero
zm
zr
`;

    function preprocess(text) {
        text = String(text);
        const stopwordsSet = new Set(stopwords.split('\n').map((item) => item.trim()));
    
        // Normalize text
        text = text.replace(/[0-9]/g, ''); // Remove digits
        text = text.replace(/[^a-zA-Z]/g, ' '); // Remove non-alphabetic characters
        text = text.toLowerCase(); // Convert to lowercase
        text = text.replace(/\s+/g, ' '); // Replace multiple spaces with a single space
        const arr = text.split(' ').filter(word => word.length > 0); // Split and filter empty strings
    
        const postProcessText = [];
        for (const word of arr) {
            const stemmedWord = stemmer(word); // Stem the word
            if (!stopwordsSet.has(stemmedWord)) {
                postProcessText.push(stemmedWord); // Add non-stopword to the list
            }
        }
    
        const output = [];
    
        // Generate trigrams
        for (let i = 0; i < postProcessText.length - 2; i++) {
            output.push(postProcessText[i] + ' ' + postProcessText[i + 1] + ' ' + postProcessText[i + 2]);
        }
    
        // Generate bigrams
        for (let i = 0; i < postProcessText.length - 1; i++) {
            output.push(postProcessText[i] + ' ' + postProcessText[i + 1]);
        }
    
        // Generate unigrams
        for (const word of postProcessText) {
            output.push(word);
        }
    
        return output;
    }

    words = preprocess(value);
    docWordCount = words.length;

    for (let i = 0; i < words.length; i++) {
        word = words[i];
        word = String(word);
        if (word in out) {
            out[word][1] += 1;
        } else {
            out[word] = [key, 1, docWordCount, totalDocs];
        }
    }

    return out;
}

/**
 * Reducer part of the tf-idf inverted index calculations
 * @param {*} key word in the corpus being processed
 * @param {*} values list of lists of [docID, wordFrequency, docWordCount, totalDocs], where each inner list is from a doc that contains the word
 * @return a dictionary of {key: word, value: [[docID, TF, totalDocs]]} for each docID that contains the word
 */
function invertedIndexReducer(key, values) {
  docTFs = [];

  for (let i = 0; i < values.length; i++) {
      docID = values[i][0];
      wordFrequency = values[i][1];
      docWordCount = values[i][2];
      totalDocs = values[i][3]; // Should be the same across all values

      tf = (wordFrequency / docWordCount);

      docTFs.push([docID, tf, totalDocs]);
  }


  return { key: key, values: docTFs };
}

module.exports = {
    invertedIndexMapper,
    invertedIndexReducer
};