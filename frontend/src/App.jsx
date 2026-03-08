import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

const API_BASE = 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

const DECORATIONS = {
  general: "ls -la\nsudo apt update\nchmod +x script.sh\ncat /etc/passwd\ngrep -r 'securinets'\nwhoami\nps aux\nnetstat -tuln\nCyber security is not a product but a process.",
  crypto: "openssl genrsa\nbase64 -d\nAES-256-CBC\nRSA-4096\nsha256sum\nROT13 decryption\nElliptic Curve Cryptography\nIn cryptography we trust.",
  web_exp: "sqlmap -u target.com\nxss payload <script>\ndirb http://target\nburp suite professional\nLFI /etc/passwd\nCSRF token bypass\nIDOR vulnerability",
  forensics: "strings memory.dmp\nvolatility -f mem.raw\nexiftool image.jpg\nbinwalk -e firmware.bin\nautopsy digital investigation\nwireshark pcap analysis\nFTK Imager",
  reverse: "objdump -d binary\nchmod +x crackme\nbinary ninja\ngdb -q ./exec\nIDA Pro static analysis\nghidra decompiler\nradare2 command line\nStatic analysis vs Dynamic analysis",
  pwn: "checksec ./binary\ncyclic 100\npattern offset\nROP chain gadget\nstack canary bypass\nASLR disabled\nshellcode injected\nHeap exploitation",
  mobile: "adb shell\nfrida-ps -Uai\nobjection explore\ndex2jar classes.dex\njadx-gui decompilation\nruntime instrumentation\nipa injection",
  linux: "ls -R /\nfind / -perm -4000\nchown root:root\necho $PATH\numask 022\nsystemctl status ssh\ntop -i\nvi /etc/shadow",
  networking: "nmap -sV -sC\ntraceroute 8.8.8.8\nip addr show\nssh-keygen -t rsa\ntcpdump -i eth0\narp -a\ndnsenum example.com",
  web_dev: "npm install react\nvite build\nconst [data, setData] = useState([]);\nconsole.log(error);\nflex-direction: column;\nmedia queries\nrest api endpoint",
  threat_intel: "IOC list updated\nMISP synchronization\nMITRE ATT&CK framework\nAPT groups tracking\nTTP analysis\nthreat actor profiling\nOSINT data gathering"
};

const App = () => {
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchChannels();
    }
  }, [user]);

  useEffect(() => {
    if (currentChannel) {
      fetchPosts(currentChannel.slug);
    }
  }, [currentChannel]);

  const fetchChannels = async () => {
    try {
      const res = await axios.get(`${API_BASE}/channels`);
      setChannels(res.data);
      if (res.data.length > 0 && !currentChannel) {
        setCurrentChannel(res.data[0]);
      }
    } catch (err) {
      console.error("Error fetching channels", err);
    }
  };

  const fetchPosts = async (slug) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/channels/${slug}/posts`);
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/login`, { username, password });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      alert("Login failed");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/register`, { username, password });
      alert("Signup successful, please login");
      setAuthMode('login');
    } catch (err) {
      alert("Signup failed");
    }
  };

  const handleLogout = async () => {
    await axios.get(`${API_BASE}/logout`);
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Securinets ISET'R</h1>
          <form onSubmit={authMode === 'login' ? handleLogin : handleSignup}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn" style={{ width: '100%' }}>
              {authMode === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </form>
          <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <span
              style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            >
              {authMode === 'login' ? 'Sign Up' : 'Login'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>Securinets</h2>
        <ul className="channel-list">
          {channels.map(ch => (
            <li
              key={ch.id}
              className={`channel-item ${currentChannel?.id === ch.id ? 'active' : ''}`}
              onClick={() => setCurrentChannel(ch)}
            >
              # {ch.name}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <p style={{ marginBottom: '0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Session: <span style={{ color: 'var(--accent-color)' }}>{user.username}</span>
          </p>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%' }}>Logout</button>
        </div>
      </div>
      <main className="main-content">
        <div className="bg-decor">
          {DECORATIONS[currentChannel?.slug] || DECORATIONS.general}
          {"\n" + (DECORATIONS[currentChannel?.slug] || DECORATIONS.general).repeat(5)}
        </div>
        <div className="content-wrapper">
          <PostForm user={user} channel={currentChannel} onPostCreated={() => fetchPosts(currentChannel.slug)} />
          {loading ? (
            <div className="post-card" style={{ textAlign: 'center' }}>Initializing channel...</div>
          ) : (
            posts.length > 0 ? posts.map(post => <PostCard key={post.id} post={post} />) : (
              <div className="post-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No traffic found in this channel.</div>
            )
          )}
        </div>
      </main>
    </div>
  );
};

const PostForm = ({ user, channel, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canPost = user.is_admin || channel?.slug === 'general';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // Prevent multiple requests

    setSubmitting(true);
    const formData = new FormData();
    formData.append('content', content);
    formData.append('channel_id', channel.id);
    if (file) formData.append('file', file);

    try {
      await axios.post(`${API_BASE}/posts`, formData);
      setContent('');
      setFile(null);
      onPostCreated();
    } catch (err) {
      alert("Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canPost) {
    return <div className="post-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Only admins can post in this channel.</div>;
  }

  return (
    <div className="post-form">
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder={`What's on your mind? (Posting in #${channel?.name})`}
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div className="post-form-footer">
          <input
            type="file"
            onChange={e => setFile(e.target.files[0])}
            style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}
          />
          <button className="btn" disabled={submitting || (!content && !file)}>
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

const PostCard = ({ post }) => {
  return (
    <div className="post-card">
      <div className="post-header">
        <span className="post-author">@{post.poster}</span>
        <span className="post-time">{new Date(post.timestamp).toLocaleString()}</span>
      </div>
      <div className="post-content">{post.content}</div>
      {post.media_url && (
        <div className="post-media">
          {post.media_type === 'image' && <img src={`http://localhost:5000/uploads/${post.media_url}`} alt="Post media" />}
          {post.media_type === 'video' && <video controls src={`http://localhost:5000/uploads/${post.media_url}`} />}
          {post.media_type === 'file' && (
            <a href={`http://localhost:5000/uploads/${post.media_url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>
              Download File: {post.media_url}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
