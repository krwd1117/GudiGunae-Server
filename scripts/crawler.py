from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time

# Chrome 옵션 설정 (headless 모드 사용)
chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--disable-gpu')

# chromedriver의 경로 지정 (환경에 맞게 수정)
service = Service('/opt/homebrew/bin/chromedriver')

# WebDriver 생성
driver = webdriver.Chrome(service=service, options=chrome_options)

# 처리할 URL 리스트
urls = [
    'http://pf.kakao.com/_xdLzxgG', # 벽산더이룸
    'http://pf.kakao.com/_QRALxb', # 한신아이티
    'https://pf.kakao.com/_xjQpls', # 미가 푸드빌
    'https://pf.kakao.com/_Xxhxkhs', # 윤쉐프 코오롱
    'http://pf.kakao.com/_QLvRn', # 더이츠푸드
    'https://pf.kakao.com/_mWmPs', # 윤쉐프 구로 E&C
    'https://pf.kakao.com/_xaYxgFG', #자연푸드 구내식당
    'https://pf.kakao.com/_hMlAG/posts', # 푸드 1번가
]

for url in urls:
    try:
        print("접속 중:", url)
        driver.get(url)
        # 페이지가 로딩될 때까지 잠시 대기 (동적 로딩 시간에 맞게 조절)
        time.sleep(3)
        
        # 식당 이름 찾기
        name_tag = driver.find_element(By.CLASS_NAME, 'tit_name')
        name = name_tag.text
        
        # btn_thumb 클래스를 가진 버튼 클릭하기
        button = driver.find_element(By.CLASS_NAME, 'btn_thumb')
        button.click()
        # 버튼 클릭 후, 콘텐츠 로딩 대기 (필요 시 조절)
        time.sleep(1)
        
        # view_thumb 클래스를 가진 요소 내부에서 img_thumb 클래스를 가진 img 태그 찾기
        div_tag = driver.find_element(By.CLASS_NAME, 'view_thumb')
        img_tag = div_tag.find_element(By.CLASS_NAME, 'img_thumb')
        src_value = img_tag.get_attribute('src')
        
        print("식당 이름:", name)
        print("이미지 주소:", src_value)
        print("-" * 40)
    except Exception as e:
        print("URL:", url)
        print("오류 발생:", e)
        print("-" * 40)

driver.quit()
