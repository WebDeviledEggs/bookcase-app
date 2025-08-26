import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './MyStats.css';

const MyStats = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [genreData, setGenreData] = useState([]);
  const [habitsData, setHabitsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState(30);
  const [ratingTypeFilter, setRatingTypeFilter] = useState('overall');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    fetchStats();
  }, [timeFilter]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch all stats data
      const [dashboardRes, timelineRes, genreRes, habitsRes] = await Promise.all([
        axios.get('/api/stats/dashboard/', config),
        axios.get(`/api/stats/reading-timeline/?days=${timeFilter}`, config),
        axios.get('/api/stats/genre-breakdown/', config),
        axios.get('/api/stats/reading-habits/', config)
      ]);

      setDashboardStats(dashboardRes.data);
      setTimelineData(timelineRes.data);
      setGenreData(genreRes.data);
      setHabitsData(habitsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingsByType = async (ratingType) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.get(`/api/books/ratings/?rating_type=${ratingType}`, config);
      return response.data;
    } catch (err) {
      console.error('Error fetching ratings:', err);
      return [];
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const StatCard = ({ title, value, subtitle, icon, color = '#4F46E5' }) => (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-header">
        <div className="stat-icon" style={{ backgroundColor: color }}>
          {icon}
        </div>
        <div className="stat-content">
          <h3 className="stat-title">{title}</h3>
          <div className="stat-value">{value}</div>
          {subtitle && <div className="stat-subtitle">{subtitle}</div>}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="stats-container">
        <div className="loading">Loading your reading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-container">
        <div className="error">{error}</div>
        <button onClick={fetchStats} className="retry-btn">Retry</button>
      </div>
    );
  }

  if (!dashboardStats) {
    return (
      <div className="stats-container">
        <div className="error">No statistics available</div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h1>📊 Reading Dashboard</h1>
        <p>Track your reading progress and discover your reading patterns</p>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <StatCard
          title="Books This Year"
          value={dashboardStats.books_this_year}
          subtitle={`${dashboardStats.books_all_time} total`}
          icon="📚"
          color="#10B981"
        />
        <StatCard
          title="Pages This Year"
          value={formatNumber(dashboardStats.pages_this_year)}
          subtitle={`${formatNumber(dashboardStats.pages_all_time)} total`}
          icon="📖"
          color="#3B82F6"
        />
        <StatCard
          title="Current Streak"
          value={`${dashboardStats.current_streak_days} days`}
          subtitle={`Longest: ${dashboardStats.longest_streak_days} days`}
          icon="🔥"
          color="#F59E0B"
        />
        <StatCard
          title="Average Rating"
          value={dashboardStats.avg_rating}
          subtitle={`${dashboardStats.total_ratings} ratings`}
          icon="⭐"
          color="#8B5CF6"
        />
      </div>

      {/* Time-based Metrics */}
      <div className="stats-section">
        <h2>📅 Reading Activity Over Time</h2>
        <div className="time-metrics">
          <div className="metric-item">
            <span className="metric-label">Last 7 days:</span>
            <span className="metric-value">{dashboardStats.books_last_7_days} books, {formatNumber(dashboardStats.pages_last_30_days)} pages</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Last 14 days:</span>
            <span className="metric-value">{dashboardStats.books_last_14_days} books, {formatNumber(dashboardStats.pages_last_30_days)} pages</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Last 30 days:</span>
            <span className="metric-value">{dashboardStats.books_last_30_days} books, {formatNumber(dashboardStats.pages_last_30_days)} pages</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Last 60 days:</span>
            <span className="metric-value">{dashboardStats.books_last_60_days} books, {formatNumber(dashboardStats.pages_last_60_days)} pages</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Last 90 days:</span>
            <span className="metric-value">{dashboardStats.books_last_90_days} books, {formatNumber(dashboardStats.pages_last_90_days)} pages</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">This year:</span>
            <span className="metric-value">{dashboardStats.books_this_year} books, {formatNumber(dashboardStats.pages_this_year)} pages</span>
          </div>
        </div>
      </div>

      {/* Monthly Reading Chart */}
      <div className="stats-section">
        <h2>📊 Monthly Reading Progress</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={Object.entries(dashboardStats.monthly_books || {}).map(([month, count]) => ({
            month: new Date(2024, parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' }),
            books: count
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => Math.round(value)} />
            <Tooltip formatter={(value, name) => [value, 'Books Read']} />
            <Bar dataKey="books" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reading Timeline Chart */}
      <div className="stats-section">
        <h2>📈 Reading Timeline</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
              formatter={(value, name) => [value, name === 'pages_read' ? 'Pages Read' : name === 'books_finished' ? 'Books Finished' : 'Books Started']}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="pages_read" 
              stackId="1" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="books_finished" 
              stackId="2" 
              stroke="#82ca9d" 
              fill="#82ca9d" 
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Genre Breakdown */}
      <div className="stats-section">
        <h2>🎭 Genre Breakdown</h2>
        <div className="genre-charts">
          <div className="genre-pie">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genreData.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ genre, percentage }) => `${genre} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="book_count"
                >
                  {genreData.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, 'Books']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="genre-list">
            <h3>Top Genres</h3>
            {genreData.slice(0, 10).map((genre, index) => (
              <div key={genre.genre} className="genre-item">
                <span className="genre-name">{genre.genre}</span>
                <span className="genre-count">{genre.book_count} books</span>
                <span className="genre-pages">{formatNumber(genre.total_pages)} pages</span>
                <span className="genre-rating">⭐ {genre.avg_rating}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reading Habits */}
      {habitsData && (
        <div className="stats-section">
          <h2>📊 Reading Habits</h2>
          <div className="habits-grid">
            <div className="habits-card">
              <h3>Reading Speed</h3>
              <div className="habit-metric">
                <span>Avg pages per day:</span>
                <strong>{habitsData.avg_pages_per_day}</strong>
              </div>
              <div className="habit-metric">
                <span>Avg pages per session:</span>
                <strong>{habitsData.avg_pages_per_session}</strong>
              </div>
              <div className="habit-metric">
                <span>Avg session duration:</span>
                <strong>{habitsData.avg_session_duration} min</strong>
              </div>
            </div>

            <div className="habits-card">
              <h3>Most Productive Days</h3>
              {habitsData.most_productive_days.map((day, index) => (
                <div key={day.day} className="habit-metric">
                  <span>{day.day}:</span>
                  <strong>{day.pages} pages</strong>
                </div>
              ))}
            </div>

            <div className="habits-card">
              <h3>Favorite Authors</h3>
              {habitsData.favorite_authors.map((author, index) => (
                <div key={author.author} className="habit-metric">
                  <span>{author.author}:</span>
                  <strong>{author.count} books</strong>
                </div>
              ))}
            </div>

            <div className="habits-card">
              <h3>Book Sizes</h3>
              <div className="habit-metric">
                <span>Longest book:</span>
                <strong>{habitsData.longest_books[0]?.title} ({habitsData.longest_books[0]?.pages} pages)</strong>
              </div>
              <div className="habit-metric">
                <span>Shortest book:</span>
                <strong>{habitsData.shortest_books[0]?.title} ({habitsData.shortest_books[0]?.pages} pages)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      <div className="stats-section">
        <h2>⭐ Rating Distribution</h2>
        <div className="rating-filter">
          <label>Rating Type: </label>
          <select value={ratingTypeFilter} onChange={(e) => setRatingTypeFilter(e.target.value)}>
            <option value="overall">Overall</option>
            <option value="enjoyment">Enjoyment</option>
            <option value="critique">Critique</option>
            <option value="plot">Plot</option>
            <option value="character">Character Development</option>
            <option value="setting">Setting/World Building</option>
            <option value="theme">Themes</option>
            <option value="prose">Prose/Writing Style</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={Object.entries(dashboardStats.rating_distribution).map(([rating, count]) => ({ rating, count }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rating" />
            <YAxis tickFormatter={(value) => Math.round(value)} />
            <Tooltip formatter={(value, name) => [value, 'Books']} />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MyStats;