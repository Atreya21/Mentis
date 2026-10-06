from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = MongoClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Clear existing data
db.games.delete_many({})
db.curiofacts.delete_many({})

# Add Games
games = [
    {
        "id": str(uuid.uuid4()),
        "title": "Mathsframe Interactive Games",
        "description": "Collection of top-rated interactive mathematics games and visual challenges covering arithmetic, geometry, fractions, times tables, and shape sorting with engaging arcade mechanics.",
        "url": "https://mathsframe.co.uk/en/resources/category/22/most-popular",
        "thumbnail": "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800",
        "difficulty": "easy",
        "math_domain": ["algebra", "geometry", "number_theory"],
        "education_level": ["primary", "high_school"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Desmos Polygraph & Coordinate Challenges",
        "description": "Collaborative interactive mathematical guessing games and graphical puzzles. Deduce hidden mathematical curves, coordinate points, and geometric figures while mastering mathematical vocabulary.",
        "url": "https://classroom.amplify.com/activity/5984b0d9723ca40cd48051d6?collections=651ca31cf69ee59aa9e3818a%2C632c77b104648305feffcfda",
        "thumbnail": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
        "difficulty": "medium",
        "math_domain": ["geometry", "algebra", "calculus"],
        "education_level": ["high_school", "ug"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Draw a Perfect Circle",
        "description": "Challenge your geometric precision! Freehand draw a circle and let the mathematical engine score your symmetry, eccentricity, and radius variance in real time.",
        "url": "https://neal.fun/perfect-circle/",
        "thumbnail": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800",
        "difficulty": "easy",
        "math_domain": ["geometry", "applied_math"],
        "education_level": ["primary", "high_school", "ug"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Amplify Desmos Interactive Math Lab",
        "description": "Rich digital math explorations covering linear equations, quadratic curves, transformations, exponential growth, and trigonometry through visual sliders and dynamic simulations.",
        "url": "https://classroom.amplify.com/search?subjects=Math",
        "thumbnail": "https://images.unsplash.com/photo-1509869175650-a1c97834a563?w=800",
        "difficulty": "medium",
        "math_domain": ["algebra", "calculus", "geometry", "trigonometry"],
        "education_level": ["high_school", "ug"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Nerdle — Daily Math Equation Game",
        "description": "The viral daily mathematical puzzle where players have six guesses to deduce a hidden eight-character mathematical equation using digits and operators. Test your algebraic logic.",
        "url": "https://nerdlegame.com/",
        "thumbnail": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
        "difficulty": "medium",
        "math_domain": ["algebra", "number_theory", "discrete_math"],
        "education_level": ["primary", "high_school", "ug", "pg"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Seeing Theory — Visual Probability & Statistics",
        "description": "An award-winning interactive visual introduction to probability and statistics from Brown University. Experiment with compound probability, random variables, statistical inference, and Bayesian reasoning.",
        "url": "https://seeing-theory.brown.edu/",
        "thumbnail": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
        "difficulty": "hard",
        "math_domain": ["statistics", "applied_math"],
        "education_level": ["high_school", "ug", "pg", "research"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "PhET Interactive Math Simulations",
        "description": "Research-backed gamified math simulations from CU Boulder. Experiment with vector additions, graph quadratics, calculus derivatives, area models, and fraction matchers.",
        "url": "https://phet.colorado.edu/en/simulations/browse?subject=math",
        "thumbnail": "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=800",
        "difficulty": "easy",
        "math_domain": ["algebra", "geometry", "calculus", "applied_math"],
        "education_level": ["primary", "high_school", "ug"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Euclidea — Geometric Construction Puzzle",
        "description": "A brilliantly designed puzzle game based on classical Euclidean ruler-and-compass geometric constructions. Discover elegant minimal-step geometric proofs and constructions.",
        "url": "https://www.euclidea.xyz/",
        "thumbnail": "https://images.unsplash.com/photo-1634170380000-149bfbbb39fd?w=800",
        "difficulty": "hard",
        "math_domain": ["geometry", "discrete_math"],
        "education_level": ["high_school", "ug", "pg"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "GeoGebra Interactive Math Playground",
        "description": "Thousands of dynamic mathematical experiments, calculus curve visualizers, Fourier series simulations, 3D geometric polyhedra, and fractal generators.",
        "url": "https://www.geogebra.org/materials",
        "thumbnail": "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800",
        "difficulty": "medium",
        "math_domain": ["geometry", "calculus", "linear_algebra", "applied_math"],
        "education_level": ["high_school", "ug", "pg"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "NRICH Maths Interactive Challenges",
        "description": "University of Cambridge's mathematical enrichment hub offering non-routine problem solving, strategic game theory challenges, and investigative math tasks for inquisitive minds.",
        "url": "https://nrich.maths.org/",
        "thumbnail": "https://images.unsplash.com/photo-1612207897744-6b7c13b5e36e?w=800",
        "difficulty": "hard",
        "math_domain": ["number_theory", "discrete_math", "combinatorics"],
        "education_level": ["high_school", "ug", "pg"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Wolfram Math Demonstrations",
        "description": "Open-code interactive computational explorations powered by Mathematica. Visualize complex topology, Mandelbrot fractals, cellular automata, differential systems, and quantum matrices.",
        "url": "https://demonstrations.wolfram.com/",
        "thumbnail": "https://images.unsplash.com/photo-1632571401005-458e9d244591?w=800",
        "difficulty": "hard",
        "math_domain": ["topology", "complex_analysis", "differential_equations", "applied_math"],
        "education_level": ["ug", "pg", "research"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Brilliant Interactive Math Explorations",
        "description": "Visual, first-principles mathematical puzzles that turn complex abstract concepts in algebra, combinatorics, probability, and logic into intuitive games.",
        "url": "https://brilliant.org/courses/math-fundamentals/",
        "thumbnail": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
        "difficulty": "medium",
        "math_domain": ["algebra", "discrete_math", "number_theory", "combinatorics"],
        "education_level": ["high_school", "ug"],
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "DragonBox Algebraic Foundations",
        "description": "A pioneering visual algebra learning experience that turns equation solving, balance rules, and unknown variables into intuitive gameplay mechanics without fear.",
        "url": "https://dragonbox.com/",
        "thumbnail": "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=800",
        "difficulty": "easy",
        "math_domain": ["algebra", "number_theory"],
        "education_level": ["primary", "high_school"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

# Add Curiofacts
curiofacts = [
    {
        "id": str(uuid.uuid4()),
        "title": "The Collatz Conjecture: Simple Rules, Endless Mystery",
        "content": """The Collatz Conjecture begins with a childishly simple rule:
Take any positive integer.
If it's even, divide it by 2.
If it's odd, multiply it by 3 and add 1.
Then repeat.

Astonishingly, no matter which number you start with, the sequence always seems to fall into the same loop:
4 → 2 → 1 → 4 → …

Proposed in 1937 by Lothar Collatz, this problem has resisted proof for decades despite massive computational verification. Numbers soar wildly, crash unpredictably, yet somehow always return home.

The Collatz Conjecture is mesmerizing because it lives at the edge of chaos and order—'a reminder that even the simplest rules can generate behavior too complex for mathematics to tame'.""",
        "image_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
        "published_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Why Four Is Uniquely Inevitable?",
        "content": """Four is the only number whose name has exactly the same number of letters as the quantity it represents:
F-O-U-R → 4 letters.

What makes this even more delightful is what happens next.
Start with any number, count the number of letters in its English spelling, then repeat the process with the new number.

No matter where you begin, the sequence always collapses into the same chain:

→ four → 4 → four → …

For example:
seven → 5 → five → 4 → four
ninety-nine → 10 → ten → 3 → three → 5 → five → 4 → four

In this quirky linguistic loop, four acts like a fixed point, an unavoidable destination where the process stabilizes forever.

It's a beautiful reminder that sometimes, language and mathematics shake hands, and when they do, four quietly sits at the center.""",
        "image_url": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800",
        "published_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "6174 – The Magical Constant",
        "content": """6174 is known as Kaprekar's Constant, and it hides a beautiful numerical magic. Take any 4-digit number (with at least two different digits), rearrange its digits to form the largest and smallest possible numbers, and subtract the smaller from the larger.
Now repeat this process.

Astonishingly, no matter which number you start with, you'll always end up at 6174 — and once you reach it, the process loops forever!

For example:
9831 − 1389 = 8442
8442 − 2448 = 5994
9954 − 4599 = 6174

This phenomenon was discovered by the brilliant Indian mathematician D. R. Kaprekar, showing how simple digit play can lead to a universal and inevitable result.

A reminder that even ordinary numbers can hide extraordinary order.""",
        "image_url": "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800",
        "published_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Forty: The Only Number in Perfect Alphabetical Order",
        "content": """Among all numbers in the English language, forty holds a quiet but remarkable distinction. It is the only number whose letters appear in strict alphabetical order. Spelled f–o–r–t–y, each letter follows the previous one exactly as arranged in the alphabet—a property no other number name possesses.

What makes this observation fascinating is its universality. From the smallest numbers to the largest—one, two, hundred, thousand, million, and beyond—every other number breaks alphabetical order somewhere in its spelling. Even composite and extended forms fail. Only forty maintains this perfect linguistic sequence.

This phenomenon sits at a rare intersection of mathematics and language. It has nothing to do with arithmetic value or numerical structure, yet it gives forty a unique identity rooted purely in spelling. Ironically, forty is already a number rich in cultural and symbolic meaning, often associated with completion, testing, and transition.

In a world where numbers are usually defined by quantity, forty stands apart by form—a reminder that sometimes, the most elegant patterns emerge not from equations, but from words themselves.""",
        "image_url": "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=800",
        "published_at": datetime.now(timezone.utc).isoformat()
    }
]

# Insert data
db.games.insert_many(games)
db.curiofacts.insert_many(curiofacts)

print(f"✓ Inserted {len(games)} games")
print(f"✓ Inserted {len(curiofacts)} curiofacts")
print("✓ Database seeding complete!")

client.close()
