# Overlay Hook

专为遮罩类组件（Overlay，Modal，等等）设计的 Hook，解决了传统 Modal 使用方式的[一些问题](https://liaofeng.feishu.cn/wiki/EJW2wwhxFiTy8yks6itcPj6knEd?from=from_copylink)

## 使用

先安装 `overlay-hook` NPM 包

```sh
npm install overlay-hook
```

首先，需要为 overlay 设置一个挂载节点，为了能够全局共享一个挂载点，以及能够获取到一些通用的配置，我们可以在最外层较靠内的位置设置这个挂载点，例如放在 antd 的 `ConfigProvider` 下

```tsx
import { OverlayProvider } from 'overlay-hook';
// antd 的 ConfigProvider 不是必须的，仅作为示例，也有可能是 react-redux 的 Provider 之类
import { ConfigProvider } from 'antd';

root.render(
  <ConfigProvider locale={zhCN}>
    {/* 设置 Overlay 的挂载节点 */}
    {/* 放在 ConfigProvider 内，确保能够获取到 ConfigProvider 的值 */}
    <OverlayProvider>
      <App />
    </OverlayProvider>
  </ConfigProvider>,
);
```

然后，在组件中通过 `useOverlay` 中返回的 `openOverlay` 来挂载和渲染相应的 overlay 组件

```tsx
import { useOverlay } from 'overlay-hook';

const App = () => {
  // 获取最近的挂载点，并使用其返回的 openOverlay 来打开 overlay
  const [openOverlay] = useOverlay();

  return (
    <Button
      onClick={async () => {
        // 打开一个 overlay
        const overlayRef = openOverlay(<MyModal></MyModal>);

        // 等待 overlay 关闭，并获取结果
        const ok = await overlayRef.afterClosed;

        if (!ok) {
          return;
        }

        message.success('操作成功');
      }}
    >
      打开弹窗
    </Button>
  );
};
```

最后，在 overlay 中调用 `useOverlayRef` 来关闭 overlay

```tsx
import { useOverlayRef } from 'overlay-hook';
import { Modal } from 'overlay-hook/antd';

const MyModal = () => {
  // 获取 overlay 对象的应用
  const overlayRef = useOverlayRef<boolean>();

  <Modal
    open
    title="My Modal"
    onCancel={() => {
      // 关闭 overlay
      overlayRef.close();
    }}
    onOk={() => {
      // 关闭 overlay 并回传结果
      overlayRef.close(true);
    }}
  >
    Content
  </Modal>;
};
```

完整的代码如下

```tsx
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { OverlayProvider, useOverlay, useOverlayRef } from 'overlay-hook';
import { Modal } from 'overlay-hook/antd';
// antd 的 ConfigProvider 不是必须的，仅作为示例，也有可能是 react-redux 的 Provider 之类
import { Button, ConfigProvider, message, Modal } from 'antd';

const MyModal = () => {
  // 获取 overlay 对象的应用
  const overlayRef = useOverlayRef<boolean>();

  <Modal
    open
    title="My Modal"
    onCancel={() => {
      // 关闭 overlay
      overlayRef.close();
    }}
    onOk={() => {
      // 关闭 overlay 并回传结果
      overlayRef.close(true);
    }}
  >
    Content
  </Modal>;
};

const App = () => {
  const [openOverlay] = useOverlay();

  return (
    <Button
      onClick={async () => {
        // 打开一个 overlay
        const overlayRef = openOverlay(<MyModal></MyModal>);

        // 等待 overlay 关闭，并获取结果
        const ok = await overlayRef.afterClosed;

        if (!ok) {
          return;
        }

        message.success('操作成功');
      }}
    >
      打开弹窗
    </Button>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <ConfigProvider locale={zhCN}>
    {/* 设置 Overlay 的挂载节点 */}
    {/* 放在 ConfigProvider 内，确保能够获取到 ConfigProvider 的值 */}
    <OverlayProvider>
      <App />
    </OverlayProvider>
  </ConfigProvider>,
);
```

## 编写 Overlay 组件

`useOverlay` 是个非常通用的 Hook，实际上任何需要即用即丢的组件渲染都可以用它来实现，当然他的渲染模式专门为了遮罩类而设计。正因为它如此的通用，所以，我们需要在使用的时候稍微的调整一下我们的组件行为。

以 Antd 的 Modal 为例，如果直接使用 Modal 的话，你会发现原本的关闭动画失效了。这是预期的行为，因为 `useOverlay` 并不知道什么时候才是合适的时机去销毁一个组件，在关闭的时候，它只是简单的立即从组件树移除那个组件，所以我们需要稍微调整一下关闭的逻辑。

`overlay-hook` 中的 `OverlayRef` 对象对外提供了一个 `onBeforeClose` 回调，我们的组件可以通过这个回调来选择合适的时机来销毁当前组件。下面是适配的示例代码

```tsx
import { useEffect, useState, type FC } from 'react';
import { Modal as AntdModal, type ModalProps as AntdModalProps } from 'antd';
import { useOverlayRef } from 'overlay-hook';

export interface CustomModalProps extends Omit<AntdModalProps, 'visible'> {
  /**
   * 默认这个 Modal 只能用在 Overlay 中
   *
   * 可以通过设置 `outOfOverlay` 为 `true` 让其在在 Overlay 外也能使用
   */
  outOfOverlay?: boolean;
}

const noop = () => {};

/**
 * 即用即扔的 Modal，一般需要与 useOverlay 一起使用
 *
 * 处理了弹出/关闭逻辑以更适合与 useOverlay 一起使用的场景
 */
export const CustomModal: FC<ModalProps> = (props) => {
  const [open, setOpen] = useState(true);
  const [resolve, setResolve] = useState(() => noop);

  const overlayRef = useOverlayRef(props.outOfOverlay ?? false);

  useEffect(() => {
    const dispose = overlayRef?.onBeforeClose(() => {
      // 等 Modal 的关闭动画完成后再销毁组件
      return new Promise<void>((resolve) => {
        setOpen(false);
        setResolve(() => resolve);
      });
    });

    return () => {
      dispose?.();
    };
  }, [overlayRef]);

  useEffect(() => {
    if (overlayRef) {
      return;
    }

    setOpen(props.open ?? false);
  }, [props.open, overlayRef]);

  return (
    <AntdModal
      {...props}
      open={open}
      afterClose={() => {
        props.afterClose?.();
        resolve?.();
      }}
      onOk={(e) => {
        props.onOk?.(e);
      }}
      onCancel={(e) => {
        props.onCancel?.(e);
      }}
    >
      {props.children}
    </AntdModal>
  );
};
```

这样子，这个自定义 Modal 就可以愉快的和 `useOverlay` 一起使用了

## FAQ

### useOverlay 只能和 Modal 一起用吗

不是的，之所以命名为 `useOverlay` 而不是 `useModal` 的原因就是它实际上能用在大多数的覆盖类（Overlay）组件上，比如另一个常见的 `Drawer` 组件，以及虽然演示中我们用的全部都是 antd 组件库中的组件，但是实际上 `useOverlay` 可以用在任何组件上，他只负责即用即丢的组件生命周期管理，且不影响原有组件的写法。不过，你可能需要考虑如何处理组件销毁前的动画问题

### 为什么状态变化后，Modal 不会重新渲染

以下代码中，试图在通过 `openOverlay` 展示 `Modal` 后，通过 `setTitle` 来修改 `Modal` 的标题

```tsx
const Faq1 = () => {
  const [openOverlay] = useOverlay();
  const [title, setTitle] = useState('弹窗标题');

  return (
    <Space>
      <Button
        onClick={() => {
          openOverlay(<FaqModal title={title}></FaqModal>);

          // 修改标题
          setTitle('新的弹窗标题');
        }}
      >
        打开弹窗
      </Button>
    </Space>
  );
};

const FaqModal = (props: { title: string }) => {
  return <Modal title={props.title}>Content</Modal>;
};
```

这是一个典型的闭包问题，在这个例子中，`setTitle` 并不会立即改变当前弹窗的标题，因为这里的 `onClick` 方法形成了一个闭包，在调用 `openOverlay` 时拿到的是上一次状态的 `title` 快照值，`setTitle` 方法只会使 `<Faq1 />` 组件重新渲染，而并不会影响到 `<FaqModal />` 组件。

### 为什么拿不到 `Context` 中的值

以下例子中期望弹窗里显示 “Hello, there!”，而实际显示的是 “Hello, world!“

```tsx
const SomeContext = createContext('world');

const App = () => {
  const [openOverlay] = useOverlay<boolean>();

  return (
    <SomeContext.Provider value="there">
      <Button
        type="primary"
        onClick={() => {
          openOverlay(<MyModal></MyModal>);
        }}
      >
        展示弹窗
      </Button>
    </SomeContext.Provider>
  );
};

const MyModal = () => {
  const overlayRef = useOverlayRef<boolean>();
  const text = useContext(SomeContext);

  return <Modal onCancel={() => overlayRef.close()}>Hello, {text}!</Modal>;
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <OverlayProvider>
    <App />
  </OverlayProvider>,
);
```

这里的 `<MyModal>` 实际渲染的位置是在 `OverlayProvider` 那个位置，所以是拿不到 `<App />` 组件中 `SomeContext` 提供的值（值：there）。得益于 React 的 Context 提供的能力，`openOverlay` 会自动获取最近的 `OverlayProvider`。为了拿到这里例子中 `SomeContext` 的值，我们可以在 `SomeContext` 下再放置一个 `OverlayProvider`（记住，我们可以在任意位置，放置任意多个 `OverlayProvider`）。

```tsx
const App = () => {
  const [openOverlay] = useOverlay<boolean>();

  return (
    <SomeContext.Provider value="there">
      <OverlayProvider>
        <Button
          type="primary"
          onClick={() => {
            openOverlay(<MyModal></MyModal>);
          }}
        >
          展示弹窗
        </Button>
      </OverlayProvider>
    </SomeContext.Provider>
  );
};
```

不过，只是这样还不够，我们可以看到，`useOverlay` 和 `<OverlayProvider />` 在同一个组件中，所以这里的 `useOverlay` 拿到的 `<OverlayProvider />` 实际上是最外层的那个（`root.render` 中的那个），为了拿到 `<SomeContext.Provider />` 下的 `OverlayProvider` 我们需要将 `<Button />` 提取出来，成为 `<App />` 中的 `<OverlayProvider />` 的子组件

```tsx
const App = () => {
  return (
    <SomeContext.Provider value="there">
      <OverlayProvider>
        // 在 MyButton 中调用 useOverlay
        <MyButton></MyButton>
      </OverlayProvider>
    </SomeContext.Provider>
  );
};

const MyButton = () => {
  const [openOverlay] = useOverlay<boolean>();

  return (
    <Button
      type="primary"
      onClick={() => {
        openOverlay(<MyModal></MyModal>);
      }}
    >
      展示弹窗
    </Button>
  );
};
```

以下是最终的实现

```tsx
const SomeContext = createContext('world');

const App = () => {
  return (
    <SomeContext.Provider value="there">
      <OverlayProvider>
        <MyButton></MyButton>
      </OverlayProvider>
    </SomeContext.Provider>
  );
};

const MyButton = () => {
  const [openOverlay] = useOverlay<boolean>();

  return (
    <Button
      type="primary"
      onClick={() => {
        openOverlay(<MyModal></MyModal>);
      }}
    >
      展示弹窗
    </Button>
  );
};

const MyModal = () => {
  const overlayRef = useOverlayRef<boolean>();
  const text = useContext(SomeContext);

  return <Modal onCancel={() => overlayRef.close()}>Hello {text}</Modal>;
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <OverlayProvider>
    <App />
  </OverlayProvider>,
);
```

### 传统的 Modal 用法是不是就没用了

不是的，当 Modal 中的状态完全来自于父组件的时候，就可以放心的使用传统的 Modal 形式，比如页面中被收起的配置项。
