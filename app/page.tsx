import Layout from './components/Layout';
import Timer from './components/Timer';
import TaskList from './components/TaskList';
import Chat from './components/Chat';

export default function Home() {
  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Task List & Audio Player Section - Left Sidebar */}
          <div className="lg:col-span-3 flex items-start justify-center">
            <TaskList />
          </div>

          {/* Timer Section - Central Focus Area */}
          <div className="lg:col-span-6 flex items-center justify-center min-h-[500px]">
            <div className="w-full max-w-2xl">
              <Timer />
            </div>
          </div>

          {/* Chat Section - Right Sidebar */}
          <div className="lg:col-span-3 flex items-start justify-center">
            <Chat />
          </div>
        </div>
      </div>
    </Layout>
  );
}
