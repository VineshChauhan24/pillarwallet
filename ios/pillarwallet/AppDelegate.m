// Copyright 2015-present 650 Industries. All rights reserved.
#import "Firebase.h"
#import "AppDelegate.h"
#import "RNFirebaseNotifications.h"
#import "RNFirebaseMessaging.h"
#import "Intercom/intercom.h"
#import "Fabric/Fabric.h"
#import "React/RCTRootView.h"
#import "Crashlytics/Crashlytics.h"
#import "RNSplashScreen.h"
#import "RNSentry.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    NSURL *jsCodeLocation;
    [FIRApp configure];
    [RNFirebaseNotifications configure];
    [Fabric with:@[[Crashlytics class]]];
    #ifdef DEBUG
      jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
      [Intercom setApiKey:@"ios_sdk-8c4a15ada22af46599f62d1bef70c7c121957dd7" forAppId:@"xbjzrshe"];
    #else
      [Intercom setApiKey:@"ios_sdk-f210e1d785d4c0e64ab3ba0f529d64c47da59186" forAppId:@"s70dqvb2"];
      jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
    #endif
    RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                        moduleName:@"pillarwallet"
                                                initialProperties:nil
                                                    launchOptions:launchOptions];
    [RNSentry installWithRootView:rootView];

    self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
    UIViewController *rootViewController = [UIViewController new];
    rootViewController.view = rootView;
    self.window.rootViewController = rootViewController;
    [self.window makeKeyAndVisible];
    [RNSplashScreen show];
    return YES;
}

#pragma mark - Notifications

- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification {
  [[RNFirebaseNotifications instance] didReceiveLocalNotification:notification];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(nonnull NSDictionary *)userInfo
                                                       fetchCompletionHandler:(nonnull void (^)(UIBackgroundFetchResult))completionHandler{
  [[RNFirebaseNotifications instance] didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
     [Intercom setDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings {
  [[RNFirebaseMessaging instance] didRegisterUserNotificationSettings:notificationSettings];
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
  return [RCTLinkingManager application:application openURL:url
                      sourceApplication:sourceApplication annotation:annotation];
}
- (void)applicationDidBecomeActive:(UIApplication *)application {
  [application registerUserNotificationSettings:
   [UIUserNotificationSettings settingsForTypes:(UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert)
                                     categories:nil]];
  [application registerForRemoteNotifications];
}

@end
