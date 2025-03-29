
import React from 'react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <div className="flex items-center">
      <Link to="/" className="text-xl font-bold">
        StorySnap
      </Link>
      <nav className="ml-6">
        <ul className="flex space-x-4">
          <li>
            <Link to="/create-story" className="hover:text-blue-500">
              Create Story
            </Link>
          </li>
          <li>
            <Link to="/my-stories" className="hover:text-blue-500">
              My Stories
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};
