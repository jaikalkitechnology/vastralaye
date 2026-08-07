"""
Seed script to generate 100 Indian users and product reviews
Each user will review 3 random products with ratings 3.5-5.0
"""

import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.security import get_password_hash

# Update this with your database URL
DATABASE_URL = "mysql+pymysql://mizormart01:mizor0966@localhost/mizormart_schema"

# List of 100 Indian names (50 male, 50 female)
INDIAN_USERS = [
    # Male names
    {"first_name": "Rajesh", "last_name": "Kumar", "email": "rajesh.kumar@gmail.com"},
    {"first_name": "Amit", "last_name": "Sharma", "email": "amit.sharma@gmail.com"},
    {"first_name": "Vikram", "last_name": "Singh", "email": "vikram.singh@gmail.com"},
    {"first_name": "Arjun", "last_name": "Patel", "email": "arjun.patel@gmail.com"},
    {"first_name": "Rohit", "last_name": "Verma", "email": "rohit.verma@gmail.com"},
    {"first_name": "Karan", "last_name": "Gupta", "email": "karan.gupta@gmail.com"},
    {"first_name": "Suresh", "last_name": "Reddy", "email": "suresh.reddy@gmail.com"},
    {"first_name": "Manish", "last_name": "Rao", "email": "manish.rao@gmail.com"},
    {"first_name": "Anil", "last_name": "Mehta", "email": "anil.mehta@gmail.com"},
    {"first_name": "Deepak", "last_name": "Joshi", "email": "deepak.joshi@gmail.com"},
    {"first_name": "Sanjay", "last_name": "Nair", "email": "sanjay.nair@gmail.com"},
    {"first_name": "Rahul", "last_name": "Mishra", "email": "rahul.mishra@gmail.com"},
    {"first_name": "Nitin", "last_name": "Agarwal", "email": "nitin.agarwal@gmail.com"},
    {"first_name": "Vishal", "last_name": "Desai", "email": "vishal.desai@gmail.com"},
    {"first_name": "Prakash", "last_name": "Iyer", "email": "prakash.iyer@gmail.com"},
    {"first_name": "Ankit", "last_name": "Pandey", "email": "ankit.pandey@gmail.com"},
    {"first_name": "Gaurav", "last_name": "Saxena", "email": "gaurav.saxena@gmail.com"},
    {"first_name": "Ashok", "last_name": "Pillai", "email": "ashok.pillai@gmail.com"},
    {"first_name": "Ravi", "last_name": "Chopra", "email": "ravi.chopra@gmail.com"},
    {"first_name": "Manoj", "last_name": "Bhatt", "email": "manoj.bhatt@gmail.com"},
    {"first_name": "Vijay", "last_name": "Menon", "email": "vijay.menon@gmail.com"},
    {"first_name": "Naveen", "last_name": "Sinha", "email": "naveen.sinha@gmail.com"},
    {"first_name": "Sachin", "last_name": "Kapoor", "email": "sachin.kapoor@gmail.com"},
    {"first_name": "Ajay", "last_name": "Tripathi", "email": "ajay.tripathi@gmail.com"},
    {"first_name": "Siddharth", "last_name": "Malhotra", "email": "siddharth.malhotra@gmail.com"},
    {"first_name": "Harish", "last_name": "Bhatia", "email": "harish.bhatia@gmail.com"},
    {"first_name": "Vinod", "last_name": "Kulkarni", "email": "vinod.kulkarni@gmail.com"},
    {"first_name": "Pankaj", "last_name": "Tiwari", "email": "pankaj.tiwari@gmail.com"},
    {"first_name": "Rakesh", "last_name": "Shukla", "email": "rakesh.shukla@gmail.com"},
    {"first_name": "Abhishek", "last_name": "Jain", "email": "abhishek.jain@gmail.com"},
    {"first_name": "Vivek", "last_name": "Bansal", "email": "vivek.bansal@gmail.com"},
    {"first_name": "Akash", "last_name": "Dwivedi", "email": "akash.dwivedi@gmail.com"},
    {"first_name": "Sandeep", "last_name": "Chawla", "email": "sandeep.chawla@gmail.com"},
    {"first_name": "Pradeep", "last_name": "Goyal", "email": "pradeep.goyal@gmail.com"},
    {"first_name": "Kunal", "last_name": "Bajaj", "email": "kunal.bajaj@gmail.com"},
    {"first_name": "Sumit", "last_name": "Dubey", "email": "sumit.dubey@gmail.com"},
    {"first_name": "Tarun", "last_name": "Khanna", "email": "tarun.khanna@gmail.com"},
    {"first_name": "Yogesh", "last_name": "Arora", "email": "yogesh.arora@gmail.com"},
    {"first_name": "Dinesh", "last_name": "Chauhan", "email": "dinesh.chauhan@gmail.com"},
    {"first_name": "Satish", "last_name": "Yadav", "email": "satish.yadav@gmail.com"},
    {"first_name": "Ramesh", "last_name": "Srivastava", "email": "ramesh.srivastava@gmail.com"},
    {"first_name": "Mukesh", "last_name": "Thakur", "email": "mukesh.thakur@gmail.com"},
    {"first_name": "Naresh", "last_name": "Bose", "email": "naresh.bose@gmail.com"},
    {"first_name": "Arun", "last_name": "Pathak", "email": "arun.pathak@gmail.com"},
    {"first_name": "Jatin", "last_name": "Seth", "email": "jatin.seth@gmail.com"},
    {"first_name": "Mohit", "last_name": "Dutta", "email": "mohit.dutta@gmail.com"},
    {"first_name": "Nikhil", "last_name": "Ranjan", "email": "nikhil.ranjan@gmail.com"},
    {"first_name": "Varun", "last_name": "Kashyap", "email": "varun.kashyap@gmail.com"},
    {"first_name": "Shekhar", "last_name": "Das", "email": "shekhar.das@gmail.com"},
    {"first_name": "Prateek", "last_name": "Bhardwaj", "email": "prateek.bhardwaj@gmail.com"},

    # Female names
    {"first_name": "Priya", "last_name": "Sharma", "email": "priya.sharma@gmail.com"},
    {"first_name": "Anjali", "last_name": "Patel", "email": "anjali.patel@gmail.com"},
    {"first_name": "Neha", "last_name": "Singh", "email": "neha.singh@gmail.com"},
    {"first_name": "Pooja", "last_name": "Gupta", "email": "pooja.gupta@gmail.com"},
    {"first_name": "Kavita", "last_name": "Kumar", "email": "kavita.kumar@gmail.com"},
    {"first_name": "Sneha", "last_name": "Reddy", "email": "sneha.reddy@gmail.com"},
    {"first_name": "Ritu", "last_name": "Verma", "email": "ritu.verma@gmail.com"},
    {"first_name": "Meera", "last_name": "Nair", "email": "meera.nair@gmail.com"},
    {"first_name": "Divya", "last_name": "Joshi", "email": "divya.joshi@gmail.com"},
    {"first_name": "Swati", "last_name": "Mehta", "email": "swati.mehta@gmail.com"},
    {"first_name": "Aarti", "last_name": "Agarwal", "email": "aarti.agarwal@gmail.com"},
    {"first_name": "Deepika", "last_name": "Desai", "email": "deepika.desai@gmail.com"},
    {"first_name": "Sunita", "last_name": "Rao", "email": "sunita.rao@gmail.com"},
    {"first_name": "Rekha", "last_name": "Pillai", "email": "rekha.pillai@gmail.com"},
    {"first_name": "Shruti", "last_name": "Pandey", "email": "shruti.pandey@gmail.com"},
    {"first_name": "Nisha", "last_name": "Mishra", "email": "nisha.mishra@gmail.com"},
    {"first_name": "Anita", "last_name": "Iyer", "email": "anita.iyer@gmail.com"},
    {"first_name": "Shweta", "last_name": "Saxena", "email": "shweta.saxena@gmail.com"},
    {"first_name": "Rachna", "last_name": "Chopra", "email": "rachna.chopra@gmail.com"},
    {"first_name": "Shalini", "last_name": "Bhatt", "email": "shalini.bhatt@gmail.com"},
    {"first_name": "Geeta", "last_name": "Menon", "email": "geeta.menon@gmail.com"},
    {"first_name": "Madhuri", "last_name": "Sinha", "email": "madhuri.sinha@gmail.com"},
    {"first_name": "Preeti", "last_name": "Kapoor", "email": "preeti.kapoor@gmail.com"},
    {"first_name": "Komal", "last_name": "Tripathi", "email": "komal.tripathi@gmail.com"},
    {"first_name": "Simran", "last_name": "Malhotra", "email": "simran.malhotra@gmail.com"},
    {"first_name": "Isha", "last_name": "Bhatia", "email": "isha.bhatia@gmail.com"},
    {"first_name": "Radhika", "last_name": "Kulkarni", "email": "radhika.kulkarni@gmail.com"},
    {"first_name": "Manisha", "last_name": "Tiwari", "email": "manisha.tiwari@gmail.com"},
    {"first_name": "Jyoti", "last_name": "Shukla", "email": "jyoti.shukla@gmail.com"},
    {"first_name": "Sapna", "last_name": "Jain", "email": "sapna.jain@gmail.com"},
    {"first_name": "Richa", "last_name": "Bansal", "email": "richa.bansal@gmail.com"},
    {"first_name": "Kiran", "last_name": "Dwivedi", "email": "kiran.dwivedi@gmail.com"},
    {"first_name": "Pallavi", "last_name": "Chawla", "email": "pallavi.chawla@gmail.com"},
    {"first_name": "Vaishali", "last_name": "Goyal", "email": "vaishali.goyal@gmail.com"},
    {"first_name": "Archana", "last_name": "Bajaj", "email": "archana.bajaj@gmail.com"},
    {"first_name": "Bharti", "last_name": "Dubey", "email": "bharti.dubey@gmail.com"},
    {"first_name": "Dipti", "last_name": "Khanna", "email": "dipti.khanna@gmail.com"},
    {"first_name": "Ekta", "last_name": "Arora", "email": "ekta.arora@gmail.com"},
    {"first_name": "Garima", "last_name": "Chauhan", "email": "garima.chauhan@gmail.com"},
    {"first_name": "Hema", "last_name": "Yadav", "email": "hema.yadav@gmail.com"},
    {"first_name": "Indira", "last_name": "Srivastava", "email": "indira.srivastava@gmail.com"},
    {"first_name": "Jaya", "last_name": "Thakur", "email": "jaya.thakur@gmail.com"},
    {"first_name": "Kriti", "last_name": "Bose", "email": "kriti.bose@gmail.com"},
    {"first_name": "Leela", "last_name": "Pathak", "email": "leela.pathak@gmail.com"},
    {"first_name": "Megha", "last_name": "Seth", "email": "megha.seth@gmail.com"},
    {"first_name": "Namita", "last_name": "Dutta", "email": "namita.dutta@gmail.com"},
    {"first_name": "Payal", "last_name": "Ranjan", "email": "payal.ranjan@gmail.com"},
    {"first_name": "Ranjana", "last_name": "Kashyap", "email": "ranjana.kashyap@gmail.com"},
    {"first_name": "Tanvi", "last_name": "Das", "email": "tanvi.das@gmail.com"},
    {"first_name": "Urmila", "last_name": "Bhardwaj", "email": "urmila.bhardwaj@gmail.com"},
]

# Indian-style product review comments (around 150 characters each)
REVIEW_COMMENTS = [
    # Positive comments (3.5-5 stars)
    "Very good product. Quality is superb and delivery was on time. Highly recommended to all. Worth the price!",
    "Excellent material and fitting is perfect. My husband loved it. Will definitely order more products from here.",
    "Good quality fabric and stitching is very nice. Looks exactly like the picture. Fast delivery also.",
    "Amazing purchase! Product quality exceeded my expectations. Comfortable to wear and looks premium.",
    "Best product in this price range. Delivery was quick and packaging was also very good. Happy with purchase.",
    "Superb quality! My daughter loved this dress. Fabric is soft and comfortable. Will buy again.",
    "Value for money product. Quality is really good and fits perfectly. Satisfied with my purchase.",
    "Nice product with good finishing. Comfortable material and true to size. Delivery was fast too.",
    "Awesome quality and perfect fit. Looks better than expected. Highly satisfied with this order.",
    "Great product! Fabric quality is excellent. My son wears it daily. Good value for money.",
    "Perfect product for daily use. Quality matches the price. Delivery was prompt. Recommending to friends.",
    "Outstanding quality! Better than local market products. Packaging was secure. Will order more soon.",
    "Loved the product! Exactly as shown in pictures. Good material and comfortable fit. Thank you!",
    "Fantastic quality and design. Received within 3 days. Product is worth every rupee spent.",
    "Excellent purchase! Quality is top-notch. My wife is very happy with this product. Keep it up!",
    "Brilliant product! Looks premium and feels comfortable. Delivery was on time. Highly recommended.",
    "Product is very good. Material is durable and color is exactly same. Happy with my shopping.",
    "Nice quality product. Fits well and looks stylish. Delivery was fast. Will order again.",
    "Good product at reasonable price. Quality is satisfactory. Received in good condition. Satisfied.",
    "Great buy! Fabric is comfortable and stitching is perfect. Looks exactly like description.",
    "Very happy with purchase. Quality is excellent for this price. Fast delivery. Recommended!",
    "Perfect fit and good quality material. Looks great. Delivery was quick. Value for money.",
    "Amazing product! My kids love wearing these. Comfortable and durable. Will buy more colors.",
    "Superb quality! Better than expected. Packaging was good. Delivery on time. Happy customer!",
    "Excellent product with good finishing. Comfortable fabric. Fits perfectly. Satisfied with order.",
    "Very nice product. Quality is impressive. My husband wears it regularly. Good purchase!",
    "Great quality product! Looks stylish and feels comfortable. Fast delivery. Recommending to all.",
    "Good material and perfect size. Exactly as described. Delivery was prompt. Will shop again.",
    "Wonderful product! Quality exceeded expectations. Comfortable to wear. Received quickly.",
    "Best quality in this price. Fabric is soft and durable. My wife is very happy. Thank you!",
    "Nice product with excellent finish. True to size and comfortable. Fast delivery. Happy!",
    "Perfect product for regular wear. Good quality material. Fits well. Delivery on time.",
    "Awesome quality! Looks exactly like picture. Comfortable fit. Quick delivery. Satisfied!",
    "Great purchase! Product quality is very good. My son loved it. Will order again soon.",
    "Very good product. Material is comfortable and durable. Fast delivery. Worth the money!",
    "Excellent quality product! Fitting is perfect. Looks premium. Delivery was quick. Happy!",
    "Superb fabric quality! Better than expected. Comfortable wear. Delivery on time. Recommended!",
    "Amazing product quality! My daughter loved it. Comfortable and looks beautiful. Will buy more.",
    "Perfect product! Good material and stitching. Fits well. Fast delivery. Value for money.",
    "Nice quality for the price. Comfortable fabric. True to size. Quick delivery. Satisfied!",
    "Good product with fine quality. Looks great. Comfortable fit. Delivered on time. Happy!",
    "Excellent purchase! Quality is really good. My family loved it. Will order more items.",
    "Great product! Material is soft and comfortable. Perfect fit. Fast delivery. Recommended!",
    "Very satisfied with quality. Looks exactly as shown. Comfortable to wear. Quick delivery!",
    "Best product! Good quality fabric. My wife uses it daily. Fast delivery. Thank you!",
    "Outstanding quality! Better than market products. Comfortable and durable. Happy with purchase!",
    "Perfect product for daily use. Good material. Fits nicely. Delivery was prompt. Satisfied!",
    "Awesome quality and design! Comfortable wear. Looks stylish. Fast delivery. Will buy again!",
    "Great value for money! Quality is excellent. My son loved it. Delivery on time. Happy!",
    "Nice product with good quality. Comfortable fit. Exactly as described. Quick delivery!",
    "Superb quality product! Looks premium. Comfortable material. Fast delivery. Highly satisfied!",
]



def create_users_and_reviews():
    """Create 100 users and assign 3 reviews to each user"""

    # Setup database
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Import models (adjust import path as needed)
        from app.models import User, ProductReview

        print("🚀 Starting user and review generation...")

        # Get all product IDs
        from app.models import Product
        products = db.query(Product).all()
        product_ids = [p.id for p in products]

        if not product_ids:
            print("❌ No products found in database!")
            return

        print(f"✅ Found {len(product_ids)} products")

        # Track which products have been reviewed
        product_review_count = {pid: 0 for pid in product_ids}

        # Create 100 users
        created_users = []
        for i, user_data in enumerate(INDIAN_USERS):
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if existing_user:
                print(f"⚠️  User {user_data['email']} already exists, skipping...")
                created_users.append(existing_user)
                continue

            # Create new user
            user = User(
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                email=user_data["email"],
                password=get_password_hash("password123"),  # Default password
                role="user",
                active=True,
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 365))
            )
            db.add(user)
            db.flush()  # Flush to get user ID
            created_users.append(user)

            if (i + 1) % 10 == 0:
                print(f"✅ Created {i + 1} users...")

        db.commit()
        print(f"✅ All 100 users created successfully!")

        # Create 3 reviews for each user (300 total reviews)
        review_count = 0
        ratings_list = [3.5, 4.0, 4.5, 5.0]

        for user in created_users:
            # Select 3 random unique products for this user
            user_products = random.sample(product_ids, min(3, len(product_ids)))

            for product_id in user_products:
                # Random rating between 3.5-5.0
                rating = random.choice(ratings_list)

                # Random comment
                comment = random.choice(REVIEW_COMMENTS)

                # Random date within last 6 months
                days_ago = random.randint(1, 180)
                review_date = datetime.utcnow() - timedelta(days=days_ago)

                # Create review
                review = ProductReview(
                    product_id=product_id,
                    user_id=user.id,
                    name=f"{user.first_name} {user.last_name}",
                    email=user.email,
                    rating=rating,
                    comment=comment,
                    created_at=review_date
                )
                db.add(review)
                product_review_count[product_id] += 1
                review_count += 1

                if review_count % 50 == 0:
                    print(f"✅ Created {review_count} reviews...")

        db.commit()
        print(f"✅ All {review_count} reviews created successfully!")

        # Update product ratings and review counts
        print("🔄 Updating product ratings and review counts...")
        for product in products:
            reviews = db.query(ProductReview).filter(ProductReview.product_id == product.id).all()
            if reviews:
                avg_rating = sum(r.rating for r in reviews) / len(reviews)
                product.rating = round(avg_rating, 2)
                product.reviews = len(reviews)

        db.commit()
        print("✅ Product ratings updated successfully!")

        # Print summary
        print("\n" + "=" * 60)
        print("📊 SUMMARY")
        print("=" * 60)
        print(f"Total Users Created: {len(created_users)}")
        print(f"Total Reviews Created: {review_count}")
        print(f"Average Reviews per Product: {review_count / len(product_ids):.2f}")
        print(f"Products with Reviews: {sum(1 for count in product_review_count.values() if count > 0)}")
        print("=" * 60)

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_users_and_reviews()