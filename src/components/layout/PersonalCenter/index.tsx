import React from 'react';
import './style.scss';
import Link from 'next/link';
import Image from 'next/image';
import logoImg from '@/assets/images/logo.png';
import avatarImg from '@/assets/images/avatar.png';
import recommendBg from '@/assets/images/recommen_bg.png';
import {
  EnvironmentOutlined,
  InboxOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import HABack from '@/components/common/HABack';

const userProfile = {
  name: '月淮',
  slogan: '去伪存真',
  location: '在西湖西北角',
  industry: '和互联网相关',
  following: 217,
  followers: 546,
};

const featuredMessage = {
  title: '风里有诗句，园友又来信',
  description: '平静自然、文明友善 谢谢你的来信',
};

const repoList = [
  {
    repoId: '111',
    title: '产品经理',
    description: '工作与思考、实践与总结',
    views: '3413 次看过',
  },
];

const PersonalCenterPage = () => {
  return (
    <div className="personal-center-page">
      <div className="personal-center-page__logo">
        <Link href={process.env.NEXT_PUBLIC_BASE_URL || '/'}>
          <Image src={logoImg} alt="HAHA-Note" />
        </Link>
      </div>

      <div className="personal-center-page__container">
        <section className="personal-center-page__hero">
          <div className="personal-center-page__avatar-wrap">
            <Image
              className="personal-center-page__avatar"
              src={avatarImg}
              alt={userProfile.name}
              width={168}
              height={168}
            />
          </div>

          <div className="personal-center-page__profile">
            <div className="personal-center-page__name-row">
              <h1 className="personal-center-page__name">{userProfile.name}</h1>
              <button type="button" className="personal-center-page__follow-btn">
                关注
              </button>
            </div>

            <p className="personal-center-page__slogan">{userProfile.slogan}</p>

            <div className="personal-center-page__meta">
              <span>
                <EnvironmentOutlined />
                {userProfile.location}
              </span>
              <span>
                <InboxOutlined />
                {userProfile.industry}
              </span>
            </div>

            <div className="personal-center-page__stats">
              <span>
                <strong>{userProfile.following}</strong>
                关注
              </span>
              <span>
                <strong>{userProfile.followers}</strong>
                粉丝
              </span>
            </div>
          </div>
        </section>

        <section className="personal-center-page__content">
          <div className="personal-center-page__main">
            <div className="personal-center-page__section">
              <h2 className="personal-center-page__section-title">知识库</h2>
              <div className="personal-center-page__repo-list">
                {repoList.map((repo) => (
                  <Link
                    key={repo.repoId}
                    href={`/repo-detail/${repo.repoId}/home`}
                    className="personal-center-page__repo-card"
                  >
                    <div className="personal-center-page__repo-cover" />
                    <div className="personal-center-page__repo-icon">
                      <InboxOutlined />
                    </div>
                    <div className="personal-center-page__repo-content">
                      <h3>{repo.title}</h3>
                      <p>{repo.description}</p>
                      <span>{repo.views}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PersonalCenterPage;
