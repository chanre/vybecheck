from calendar import c
from random import randint
from flask import Flask, request, session, make_response
from flask_cors import CORS, cross_origin
import sqlite3
from sqlite3 import Error, sqlite_version
import json
import urllib.parse

app = Flask(__name__)
CORS(app)

database = "db/vybecheck.db"

# @app.route("/")    
# def get_votes():
#     conn = get_db(database)
#     currentWebsite = str(query_website(conn, 'youtube'))
#     return(currentWebsite)

@app.route("/", methods=['POST' , 'GET'])
def send_votes():
    if request.method == 'POST':
        data = request.get_json()
        tabTitle = str(data['tab'])
        vote = str(data['vote'])
        conn = get_db(database)

        print("tabTitle: " + tabTitle)

        currentWebsite = query_website(conn, tabTitle)
        if currentWebsite == None:
            insert_website(conn, tabTitle, vote)
            currentWebsite = str(query_website(conn, tabTitle))
        else:
            update_website(conn, tabTitle, vote)
            currentWebsite = str(query_website(conn, tabTitle))
        
        print(currentWebsite)
        return currentWebsite
    else:
        tabTitle = request.args.get("title")
        print("this is the tabTitle: " + tabTitle)
        conn = get_db(database)
        currentWebsite = query_website(conn, tabTitle)
        print(currentWebsite)
        if (currentWebsite == None):
            votes = {
                "upvotes": 0,
                "downvotes": 0
            }
        else: 
            votes = {
                "upvotes": currentWebsite[0],
                "downvotes": currentWebsite[1]
            }
        return votes

def get_db(db_file):
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        print(sqlite_version)
        return conn
    except Error as e:
        print(e)

    return conn

def create_table(conn, create_table_sql):
    try:
        c = conn.cursor()
        c.execute(create_table_sql)
    except Error as e:
        print(e)

def insert_website(conn, website, vote):
    if vote == "upvote":
        sql = ''' INSERT INTO websites (name, upvotes, downvotes) VALUES(?,1,0) '''
    elif vote == "downvote":
        sql = ''' INSERT INTO websites (name, upvotes, downvotes) VALUES(?,0,1) '''
    c = conn.cursor()
    c.execute(sql, (website,))
    conn.commit()
    return c.lastrowid

def update_website(conn, website, vote):
    if vote == "upvote":
        sql = ''' UPDATE websites SET upvotes = upvotes + 1 WHERE name = ?'''
    elif vote == "downvote":
        sql = ''' UPDATE websites SET downvotes = downvotes + 1 WHERE name = ?'''
    elif vote == "uptodown":
        sql = ''' UPDATE websites SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE name = ? '''
    elif vote == "downtoup":
        sql = ''' UPDATE websites SET downvotes = downvotes - 1, upvotes = upvotes + 1 WHERE name = ? '''
    elif vote == "unupvote":
        sql = ''' UPDATE websites SET upvotes = upvotes - 1 WHERE name = ?'''
    elif vote == "undownvote":
        sql = ''' UPDATE websites SET downvotes = downvotes - 1 WHERE name = ?'''

    c = conn.cursor()
    c.execute(sql, (website,))
    conn.commit()

def delete_website(conn, id):
    sql = ''' DELETE FROM websites WHERE id=?'''
    c = conn.cursor()
    c.execute(sql, id)
    conn.commit()

def query_website(conn, name):
    sql = ''' SELECT upvotes, downvotes FROM websites WHERE name=?'''
    c = conn.cursor()
    c.execute(sql, (name,))
    return(c.fetchone())

def main():
    websitesTableCreate = """ CREATE TABLE IF NOT EXISTS websites (id integer PRIMARY KEY, name text NOT NULL, upvotes integer, downvotes integer); """
    conn = get_db(database)

    if conn is not None:
        create_table(conn, websitesTableCreate)
    else:
        print("Error! Cannot create the database connection.")

if __name__ == '__main__':
    main()