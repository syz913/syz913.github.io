# -*- coding:utf-8  -*-

import requests
from bs4 import BeautifulSoup

import time, random


def getHtml(url):
    # print(sys.getdefaultencoding())
    response = requests.get(url)
    # print(response.encoding)
    response.encoding = response.apparent_encoding
    response_code = response.status_code
    if response_code == 200:
        return response.content.decode('UTF-8')
    else:
        return None

def getLinks(html):
    links = []
    soup = BeautifulSoup(html, 'html.parser')
    for k in soup.find_all('a'):
        if "[阅读全文:]" in k:
            links.append(k['href'])
    return links

def getPopWord(html):
    soup = BeautifulSoup(html, 'html.parser')
    title = soup.find('h1', id = "doctitle")
    contents = ""
    for content in soup.find_all('div', class_='content_topp'):
        contents += content.get_text() + "\n"
    # print(contents)
    return [title.get_text(), contents]


font = "https://www.lxybaike.com/"
url='index.php?category-view-13.html' #需要爬数据的网址
homePage = getHtml(font + url)
if homePage == None:
    print("Get homePage Failed!")
else:
    links = getLinks(homePage)
    # print(homePage)
    popular_words = {}
    for link in links:
        #冷却期
        time.sleep(random.random() * 3)
        # print(font + link)
        html = getHtml(font + link)
        if html == None:
            print("Get" + font + link + "Failed!")
        else:
            popular_word = getPopWord(html)
            popular_words[popular_word[0]] = popular_word[1]
    for key in popular_words.keys():
        print(key)
        print(popular_words[key] + "\n")